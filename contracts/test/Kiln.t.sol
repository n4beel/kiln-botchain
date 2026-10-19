// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test} from "forge-std/Test.sol";
import {Kiln} from "../src/Kiln.sol";

contract KilnTest is Test {
  Kiln internal kiln;

  address internal alice = address(0xA11CE);
  address internal bob = address(0xB0B);

  event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
  event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
  event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

  function setUp() public {
    kiln = new Kiln();
    vm.warp(1_760_000_000);
    vm.roll(100);
  }

  function test_IsolatedSVG() public {
    vm.prank(alice);
    uint256 id = kiln.mint();
    assertTrue(kiln.seeds(id) != bytes32(0), "seed non-zero");
  }

  function test_Mints() public {
    vm.prank(alice);
    uint256 id = kiln.mint();
    assertEq(id, 1, "first token id should be 1");
    assertEq(kiln.ownerOf(1), alice, "alice should own token 1");
    assertEq(kiln.balanceOf(alice), 1, "alice balance should be 1");
    assertTrue(kiln.seeds(1) != bytes32(0), "seed should be non-zero");
  }

  function test_EmitsTransfer() public {
    vm.expectEmit(true, true, true, true, address(kiln));
    emit Transfer(address(0), alice, 1);
    vm.prank(alice);
    kiln.mint();
  }

  function test_TokenURIPrefix() public {
    vm.prank(alice);
    uint256 id = kiln.mint();
    string memory uri = kiln.tokenURI(id);
    bytes memory uriBytes = bytes(uri);
    bytes memory expectedPrefix = bytes("data:application/json;base64,");

    assertTrue(uriBytes.length > expectedPrefix.length, "uri too short");
    for (uint256 i = 0; i < expectedPrefix.length; i++) {
      assertEq(uriBytes[i], expectedPrefix[i], "prefix mismatch");
    }
  }

  function test_TokenURINotEmpty() public {
    vm.prank(alice);
    uint256 id = kiln.mint();
    string memory uri = kiln.tokenURI(id);
    assertTrue(bytes(uri).length > 100, "tokenURI should contain substantial content");
  }

  function test_TransferWorks() public {
    vm.prank(alice);
    uint256 id = kiln.mint();

    vm.prank(alice);
    kiln.transferFrom(alice, bob, id);

    assertEq(kiln.ownerOf(id), bob, "bob should now own token");
    assertEq(kiln.balanceOf(alice), 0, "alice balance should be 0");
    assertEq(kiln.balanceOf(bob), 1, "bob balance should be 1");
  }

  function test_GasCeiling() public {
    vm.prank(alice);
    uint256 gasBefore = gasleft();
    kiln.mint();
    uint256 gasUsed = gasBefore - gasleft();
    assertLt(gasUsed, 150_000, "mint exceeded gas ceiling");
  }

  function test_DifferentSeedsPerBlock() public {
    vm.prank(alice);
    kiln.mint();
    bytes32 seed1 = kiln.seeds(1);

    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 12);
    vm.prevrandao(bytes32(uint256(999)));

    vm.prank(bob);
    kiln.mint();
    bytes32 seed2 = kiln.seeds(2);

    assertTrue(seed1 != seed2, "seeds should differ across tokens");
  }

  function testFuzz_TokenURIAlwaysReturns(uint8 count) public {
    vm.assume(count > 0 && count <= 5);
    for (uint8 i = 0; i < count; i++) {
      vm.roll(block.number + i + 1);
      vm.prevrandao(bytes32(uint256(i + 1234)));
      uint256 id = kiln.mint();
      string memory uri = kiln.tokenURI(id);
      assertTrue(bytes(uri).length > 0, "tokenURI should not be empty");
    }
  }

  function test_BalanceTracking() public {
    vm.startPrank(alice);
    kiln.mint();
    kiln.mint();
    kiln.mint();
    vm.stopPrank();

    assertEq(kiln.balanceOf(alice), 3, "alice should have 3 tokens");
  }

  function test_RevertTokenNotFound() public {
    vm.expectRevert(abi.encodeWithSelector(Kiln.TokenNotFound.selector, 999));
    kiln.tokenURI(999);
  }

  function test_RevertZeroAddressBalance() public {
    vm.expectRevert(Kiln.ZeroAddress.selector);
    kiln.balanceOf(address(0));
  }

  function test_SupportsInterface() public view {
    assertTrue(kiln.supportsInterface(0x01ffc9a7), "ERC165");
    assertTrue(kiln.supportsInterface(0x80ac58cd), "ERC721");
    assertFalse(kiln.supportsInterface(0xffffffff), "invalid");
  }
}
