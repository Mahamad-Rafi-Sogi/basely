const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying MessagePortal with account:', deployer.address);

  const Factory = await ethers.getContractFactory('MessagePortal');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log('MessagePortal deployed to:', address);

  // Write artifact for frontend
  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'MessagePortal.sol', 'MessagePortal.json');
  let abi = [];
  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    abi = artifact.abi;
  } catch (e) {
    console.error('Could not read MessagePortal artifact ABI:', e.message);
  }
  const frontendDir = path.join(__dirname, '..', 'frontend');
  // Attempt to detect chainId
  let chainId = 'unknown';
  try { chainId = (await deployer.provider.getNetwork()).chainId.toString(); } catch {}
  fs.writeFileSync(
    path.join(frontendDir, 'messagePortalInfo.json'),
    JSON.stringify({ address, abi, network: process.env.NETWORK || 'baseSepolia', chainId }, null, 2)
  );
  console.log('Wrote frontend/messagePortalInfo.json');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
