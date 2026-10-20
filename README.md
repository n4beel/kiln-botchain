# Kiln

Generative on-chain SVG NFTs. Nothing off-chain.

### BOT Chain mainnet (677) — live

| | |
|---|---|
| Contract | [`0xdFA869d3A17BD7FB79BE237d27959a6EC1213FC3`](https://scan.botchain.ai/address/0xdFA869d3A17BD7FB79BE237d27959a6EC1213FC3) · source verified |
| Deploy block | 27329512 |

### Bohr testnet (968) — live

| | |
|---|---|
| Contract | [`0xdFA869d3A17BD7FB79BE237d27959a6EC1213FC3`](https://scan.bohr.life/address/0xdFA869d3A17BD7FB79BE237d27959a6EC1213FC3) · source verified |
| Deploy block | 27397310 |

The site targets mainnet.

---

## What it does
Kiln mints ERC-721 NFTs with artwork generated entirely on-chain from a deterministic seed. There is no IPFS, no API, no metadata server — the artwork lives directly in the contract forever.

## How it works
- Each token's seed is `keccak256(abi.encode(tokenId, block.prevrandao))`
- The SVG is procedurally assembled from seed bytes: background hue, circle positions/sizes/colors, rectangle overlays
- `tokenURI` returns a `data:application/json;base64,...` URI containing the SVG as `data:image/svg+xml;base64,...`

## What it deliberately cannot do
- **No royalties**: the contract has no royalty mechanism
- **No rarity**: no metadata rarity scoring or traits
- **No off-chain assets**: nothing external — artwork is self-contained
- **No owner**: no admin key, no privileged minter
- **No burn**: tokens cannot be destroyed

## Gas
- `mint()`: ~105k gas (well within ~120k target, ceiling: 150k)
- `transferFrom()`: ~50k gas

## Honest limits
- `block.prevrandao` is set by the validator; a validator could influence it, but the cost is not worth it for an art project
- SVG complexity is intentionally bounded to keep gas predictable and stack depth under limits
