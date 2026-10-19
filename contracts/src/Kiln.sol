// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title Kiln
/// @notice ERC-721 NFTs with fully on-chain generative SVG artwork. Nothing off-chain.
///
/// @dev What this contract can do: mint a token, transfer it, approve operators. The SVG is
/// generated deterministically from a per-token seed stored as a single bytes32.
///
/// What this contract cannot do:
/// - No royalties: no royalty mechanism of any kind.
/// - No rarity: no trait metadata, no rarity scoring.
/// - No off-chain assets: no IPFS, no gateway, no server — the artwork is self-contained.
/// - No owner: no admin key, no privileged minter, no pause, no upgrade, no recovery hatch.
/// - No burn: tokens cannot be destroyed.
///
/// Seed derivation: keccak256(abi.encode(tokenId, block.prevrandao)), stored as one bytes32 per
/// token. Honest limit: block.prevrandao is set by the validator; a sophisticated validator could
/// influence it, but the cost is not worth it for a generative art project.

// ---------------------------------------------------------------------------
// Base64 library
// ---------------------------------------------------------------------------

library Base64 {
  string internal constant _TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  function encode(bytes memory data) internal pure returns (string memory) {
    uint256 len = data.length;
    if (len == 0) return "";
    uint256 encodedLen = 4 * ((len + 2) / 3);
    bytes memory result = new bytes(encodedLen);
    bytes memory table = bytes(_TABLE);
    uint256 i; uint256 j;
    for (i = 0; i + 2 < len; i += 3) {
      result[j++] = table[uint8(data[i]) >> 2];
      result[j++] = table[((uint8(data[i]) & 3) << 4) | (uint8(data[i+1]) >> 4)];
      result[j++] = table[((uint8(data[i+1]) & 15) << 2) | (uint8(data[i+2]) >> 6)];
      result[j++] = table[uint8(data[i+2]) & 63];
    }
    if (i < len) {
      result[j++] = table[uint8(data[i]) >> 2];
      if (i + 1 < len) {
        result[j++] = table[((uint8(data[i]) & 3) << 4) | (uint8(data[i+1]) >> 4)];
        result[j++] = table[(uint8(data[i+1]) & 15) << 2];
      } else {
        result[j++] = table[(uint8(data[i]) & 3) << 4];
        result[j++] = bytes1(0x3d);
      }
      result[j++] = bytes1(0x3d);
    }
    return string(result);
  }
}

// ---------------------------------------------------------------------------
// Kiln ERC-721
// ---------------------------------------------------------------------------

contract Kiln {
  // -------------------------------------------------------------------------
  // ERC-721 storage
  // -------------------------------------------------------------------------

  uint256 private _nextTokenId;

  /// @notice The seed used to generate each token's SVG artwork.
  mapping(uint256 => bytes32) public seeds;

  mapping(uint256 => address) private _owners;
  mapping(address => uint256) private _balances;
  mapping(uint256 => address) private _tokenApprovals;
  mapping(address => mapping(address => bool)) private _operatorApprovals;

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
  event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
  event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

  // -------------------------------------------------------------------------
  // Errors
  // -------------------------------------------------------------------------

  error TokenNotFound(uint256 tokenId);
  error ZeroAddress();
  error NotOwnerOrApproved(uint256 tokenId);

  // -------------------------------------------------------------------------
  // Metadata
  // -------------------------------------------------------------------------

  function name() external pure returns (string memory) { return "Kiln"; }
  function symbol() external pure returns (string memory) { return "KILN"; }

  // -------------------------------------------------------------------------
  // Mint
  // -------------------------------------------------------------------------

  /// @notice Mint a new Kiln NFT. Anyone may call. Free beyond gas.
  /// @return tokenId The newly minted token ID.
  function mint() external returns (uint256 tokenId) {
    tokenId = ++_nextTokenId;
    seeds[tokenId] = keccak256(abi.encode(tokenId, block.prevrandao));
    _owners[tokenId] = msg.sender;
    _balances[msg.sender] += 1;
    emit Transfer(address(0), msg.sender, tokenId);
  }

  // -------------------------------------------------------------------------
  // ERC-721 reads
  // -------------------------------------------------------------------------

  function ownerOf(uint256 tokenId) external view returns (address) {
    address owner = _owners[tokenId];
    if (owner == address(0)) revert TokenNotFound(tokenId);
    return owner;
  }

  function balanceOf(address owner) external view returns (uint256) {
    if (owner == address(0)) revert ZeroAddress();
    return _balances[owner];
  }

  function getApproved(uint256 tokenId) external view returns (address) {
    if (_owners[tokenId] == address(0)) revert TokenNotFound(tokenId);
    return _tokenApprovals[tokenId];
  }

  function isApprovedForAll(address owner, address operator) external view returns (bool) {
    return _operatorApprovals[owner][operator];
  }

  function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
    return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd;
  }

  // -------------------------------------------------------------------------
  // ERC-721 approvals
  // -------------------------------------------------------------------------

  function approve(address to, uint256 tokenId) external {
    address owner = _owners[tokenId];
    if (owner == address(0)) revert TokenNotFound(tokenId);
    if (msg.sender != owner && !_operatorApprovals[owner][msg.sender]) revert NotOwnerOrApproved(tokenId);
    _tokenApprovals[tokenId] = to;
    emit Approval(owner, to, tokenId);
  }

  function setApprovalForAll(address operator, bool approved) external {
    _operatorApprovals[msg.sender][operator] = approved;
    emit ApprovalForAll(msg.sender, operator, approved);
  }

  // -------------------------------------------------------------------------
  // ERC-721 transfers
  // -------------------------------------------------------------------------

  function transferFrom(address from, address to, uint256 tokenId) external {
    address owner = _owners[tokenId];
    if (owner == address(0)) revert TokenNotFound(tokenId);
    if (to == address(0)) revert ZeroAddress();
    if (msg.sender != owner && msg.sender != _tokenApprovals[tokenId] && !_operatorApprovals[owner][msg.sender]) revert NotOwnerOrApproved(tokenId);
    _tokenApprovals[tokenId] = address(0);
    _balances[from] -= 1;
    _balances[to] += 1;
    _owners[tokenId] = to;
    emit Transfer(from, to, tokenId);
  }

  function safeTransferFrom(address from, address to, uint256 tokenId) external {
    // For simplicity, call transferFrom (no ERC721Receiver check needed for this project)
    address owner = _owners[tokenId];
    if (owner == address(0)) revert TokenNotFound(tokenId);
    if (to == address(0)) revert ZeroAddress();
    if (msg.sender != owner && msg.sender != _tokenApprovals[tokenId] && !_operatorApprovals[owner][msg.sender]) revert NotOwnerOrApproved(tokenId);
    _tokenApprovals[tokenId] = address(0);
    _balances[from] -= 1;
    _balances[to] += 1;
    _owners[tokenId] = to;
    emit Transfer(from, to, tokenId);
  }

  function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external {
    address owner = _owners[tokenId];
    if (owner == address(0)) revert TokenNotFound(tokenId);
    if (to == address(0)) revert ZeroAddress();
    if (msg.sender != owner && msg.sender != _tokenApprovals[tokenId] && !_operatorApprovals[owner][msg.sender]) revert NotOwnerOrApproved(tokenId);
    _tokenApprovals[tokenId] = address(0);
    _balances[from] -= 1;
    _balances[to] += 1;
    _owners[tokenId] = to;
    emit Transfer(from, to, tokenId);
  }

  // -------------------------------------------------------------------------
  // On-chain SVG / tokenURI
  // -------------------------------------------------------------------------

  /// @dev uint256 to decimal string.
  function _str(uint256 n) internal pure returns (string memory) {
    if (n == 0) return "0";
    uint256 digits; uint256 tmp = n;
    while (tmp != 0) { digits++; tmp /= 10; }
    bytes memory buf = new bytes(digits);
    while (n != 0) { digits--; buf[digits] = bytes1(uint8(48 + n % 10)); n /= 10; }
    return string(buf);
  }

  function _b(bytes32 seed, uint256 idx) internal pure returns (uint256) {
    return uint256(uint8(seed[idx]));
  }

  function _circle(uint256 cx, uint256 cy, uint256 r, uint256 hue, string memory opac) internal pure returns (string memory) {
    return string.concat(
      '<circle cx="', _str(cx), '" cy="', _str(cy), '" r="', _str(r),
      '" fill="hsl(', _str(hue), ',80%,60%)" opacity="', opac, '"/>'
    );
  }

  /// @dev Generate the SVG from seed bytes. All artwork is deterministic and on-chain.
  function _generateSVG(bytes32 seed) internal pure returns (string memory) {
    string memory bg = string.concat(
      '<rect width="400" height="400" fill="hsl(', _str(_b(seed, 0) * 360 / 256), ',60%,15%)"/>'
    );
    string memory c1 = _circle(_b(seed, 1) * 400 / 256, _b(seed, 2) * 400 / 256, _b(seed, 3) * 80 / 256 + 20, _b(seed, 4) * 360 / 256, "0.7");
    string memory c2 = _circle(_b(seed, 5) * 400 / 256, _b(seed, 6) * 400 / 256, _b(seed, 7) * 60 / 256 + 15, _b(seed, 8) * 360 / 256, "0.8");
    string memory c3 = _circle(_b(seed, 9) * 400 / 256, _b(seed, 10) * 400 / 256, _b(seed, 11) * 50 / 256 + 10, _b(seed, 12) * 360 / 256, "0.6");
    string memory r1 = string.concat(
      '<rect x="', _str(_b(seed, 13) * 300 / 256), '" y="', _str(_b(seed, 14) * 300 / 256),
      '" width="', _str(_b(seed, 15) * 100 / 256 + 30), '" height="', _str(_b(seed, 16) * 100 / 256 + 30),
      '" fill="hsl(', _str(_b(seed, 17) * 360 / 256), ',60%,80%)" opacity="0.5" rx="8"/>'
    );
    return string.concat('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">', bg, c1, c2, c3, r1, '</svg>');
  }

  /// @notice Returns a data URI containing a base64-encoded JSON blob whose `image` field is an
  /// on-chain SVG. No external calls, no IPFS, no server.
  function tokenURI(uint256 tokenId) external view returns (string memory) {
    if (_owners[tokenId] == address(0)) revert TokenNotFound(tokenId);
    string memory svg = _generateSVG(seeds[tokenId]);
    bytes memory jsonBytes = abi.encodePacked(
      '{"name":"Kiln #', _str(tokenId),
      '","description":"Generative on-chain SVG. Nothing off-chain.","image":"data:image/svg+xml;base64,',
      Base64.encode(bytes(svg)), '"}'
    );
    return string.concat('data:application/json;base64,', Base64.encode(jsonBytes));
  }
}
