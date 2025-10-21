const hardhat = require('hardhat');

async function main() {
  console.log('Starting deployment to Arbitrum...');
  
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // Deploy UNITE Token first
  console.log('\nDeploying UNITE Token...');
  const UniteToken = await ethers.getContractFactory('UniteToken');
  const uniteToken = await UniteToken.deploy();
  await uniteToken.deployed();
  console.log('UNITE Token deployed to:', uniteToken.address);

  // Deploy Fantasy Crypto contract
  console.log('\nDeploying Fantasy Crypto contract...');
  const FantasyCrypto = await ethers.getContractFactory('FantasyCrypto');
  
  // Set up treasury and insurance addresses (should be multisig wallets in production)
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  const insuranceAddress = process.env.INSURANCE_ADDRESS || deployer.address;
  
  const fantasyCrypto = await FantasyCrypto.deploy(
    uniteToken.address,
    treasuryAddress,
    insuranceAddress
  );
  await fantasyCrypto.deployed();
  console.log('Fantasy Crypto contract deployed to:', fantasyCrypto.address);

  // Set Fantasy Crypto contract as owner of UNITE token for reward distribution
  console.log('\nTransferring UNITE token ownership...');
  await uniteToken.transferOwnership(fantasyCrypto.address);
  console.log('UNITE token ownership transferred to Fantasy Crypto contract');

  // Verify contracts on Arbiscan (if API key is provided)
  if (process.env.ARBISCAN_API_KEY) {
    console.log('\nVerifying contracts...');
    
    try {
      await hardhat.run('verify:verify', {
        address: uniteToken.address,
        constructorArguments: []
      });
      console.log('UNITE Token verified');
    } catch (error) {
      console.log('UNITE Token verification failed:', error.message);
    }

    try {
      await hardhat.run('verify:verify', {
        address: fantasyCrypto.address,
        constructorArguments: [
          uniteToken.address,
          treasuryAddress,
          insuranceAddress
        ]
      });
      console.log('Fantasy Crypto contract verified');
    } catch (error) {
      console.log('Fantasy Crypto verification failed:', error.message);
    }
  }

  // Output deployment summary
  console.log('\n=== Deployment Summary ===');
  console.log('Network:', hardhat.network.name);
  console.log('Deployer:', deployer.address);
  console.log('UNITE Token:', uniteToken.address);
  console.log('Fantasy Crypto:', fantasyCrypto.address);
  console.log('Treasury:', treasuryAddress);
  console.log('Insurance Fund:', insuranceAddress);
  
  console.log('\n=== Next Steps ===');
  console.log('1. Update api.conf with contract addresses');
  console.log('2. Set up multisig wallets for treasury and insurance');
  console.log('3. Configure Pear Protocol API access');
  console.log('4. Set up Telegram bot for notifications');
  console.log('5. Initialize database with contract addresses');
  
  console.log('\nDeployment completed successfully! 🎉');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });