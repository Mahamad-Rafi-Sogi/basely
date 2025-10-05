# Basely: Counter + Message Portal on Base

Basely is a mini dApp demonstrating two example smart contracts and a React (Next.js + Vite) frontend to interact with them on Base networks (Base Sepolia testnet and Base Mainnet). It includes a Message Portal where users can post short on-chain messages and like them in real time.

## Contents
- `contracts/Counter.sol` – simple counter
- `contracts/MessagePortal.sol` – Basely message board with like functionality
- `scripts/deploy.js` – deploys Counter
- `scripts/deployMessagePortal.js` – deploys the Basely Message Portal
- `frontend/` – Next.js Counter page + Vite-powered Basely Message Portal UI

## Prerequisites
- Node.js >= 20 (use `nvm use 20`)
- A self-custodial wallet (MetaMask, Coinbase Wallet) with Base Sepolia test ETH
- `PRIVATE_KEY` in a local `.env` (never commit real keys)

## Environment Variables
Create `.env` at project root:
```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org
```

## Install Dependencies
```
npm install
```

## Compile Contracts
```
npx hardhat compile
```

## Deploy to Base Sepolia
Counter:
```
npm run deploy
```
MessagePortal:
```
npm run deploy:portal
```
Each deploy script writes an artifact (e.g. `frontend/contractInfo.json` or `frontend/messagePortalInfo.json`).

## Frontend Dev
```
cd frontend
npm install
npm run dev
```
Open http://localhost:3000

## Adding Base Sepolia to MetaMask
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Symbol: ETH
Block Explorer: https://sepolia.basescan.org

## Faucets for Base Sepolia
- Official: https://base.org/faucet
- Alchemy: https://www.alchemy.com/faucets/base-sepolia
- QuickNode: https://faucet.quicknode.com/base/sepolia
- Thirdweb: https://thirdweb.com/faucet
- Bridge from Ethereum Sepolia: https://bridge.base.org (testnet mode)

## Interacting with the Basely Message Portal (Script Example)
You can create a simple Hardhat task or script to post a message (not yet included). Example snippet:
```js
const portal = await ethers.getContractAt('MessagePortal', '0xDEPLOYED_ADDRESS');
const tx = await portal.postMessage('Hello Base!');
await tx.wait();
console.log('Message posted');
```

## Like / Upvote Feature
`likeMessage(index)` allows an address to like a message once. The Basely frontend disables the like button after success.

## Future Enhancements
- Advanced pagination / infinite scroll
- IPFS or Arweave storage for long messages (> 280 chars)
- Hardhat task for seeding test messages
- Verification script for Base explorers
- Profile avatars / ENS / CB.ID resolution

## Safety
- Do not commit `.env`.
- Use a dedicated deployer key for testnet vs mainnet.
- Rotate keys if compromised.

## License
MIT
