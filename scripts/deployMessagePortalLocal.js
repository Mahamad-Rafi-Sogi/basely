const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying MessagePortal locally with account:', deployer.address);
  const Factory = await ethers.getContractFactory('MessagePortal');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log('MessagePortal (local) deployed to:', address);
  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'MessagePortal.sol', 'MessagePortal.json');
  let abi = [];
  try { abi = JSON.parse(fs.readFileSync(artifactPath, 'utf8')).abi; } catch {}
  const frontendDir = path.join(__dirname, '..', 'frontend');
  fs.writeFileSync(path.join(frontendDir, 'messagePortalInfo.json'), JSON.stringify({ address, abi, network: 'localhost', chainId: 31337 }, null, 2));
  console.log('Updated frontend/messagePortalInfo.json for localhost.');
}

main().catch(e => { console.error(e); process.exitCode = 1; });
