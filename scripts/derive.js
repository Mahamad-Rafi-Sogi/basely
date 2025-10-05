require('dotenv').config();
const { Wallet } = require('ethers');

function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk || pk === '0xYOUR_PRIVATE_KEY_HERE') {
    console.error('PRIVATE_KEY is missing or still the placeholder. Update .env first.');
    process.exit(1);
  }
  try {
    const wallet = new Wallet(pk);
    console.log('Derived address from PRIVATE_KEY:', wallet.address);
  } catch (e) {
    console.error('Failed to derive wallet. Is the key valid? Error:', e.message);
    process.exit(1);
  }
}

main();
