const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Counter = await ethers.getContractFactory("Counter");
  const counter = await Counter.deploy();
  await counter.waitForDeployment();
  const address = await counter.getAddress();
  console.log("Counter deployed to:", address);

  // Read ABI from artifact
  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'Counter.sol', 'Counter.json');
  let abi = [];
  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    abi = artifact.abi;
  } catch (e) {
    console.warn('Could not read artifact for ABI, using minimal fallback. Error:', e.message);
    abi = [
      "function count() view returns (uint256)",
      "function increment()"
    ];
  }

  const frontendDir = path.join(__dirname, '..', 'frontend');
  const outFile = path.join(frontendDir, 'contractInfo.json');
  const data = { address, abi, network: 'baseSepolia', chainId: 84532 };
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
  console.log(`Wrote frontend contract info to frontend/contractInfo.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
