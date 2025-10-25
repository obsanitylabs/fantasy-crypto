const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy UNITE Token
  const UniteToken = await hre.ethers.getContractFactory("UniteToken");
  const uniteToken = await UniteToken.deploy();
  await uniteToken.deployed();

  console.log("UNITE Token deployed to:", uniteToken.address);

  // Set up treasury and insurance addresses (replace with actual addresses)
  const treasuryAddress = deployer.address; // Replace with actual treasury
  const insuranceAddress = deployer.address; // Replace with actual insurance

  // Deploy Fantasy Crypto Contract
  const FantasyCrypto = await hre.ethers.getContractFactory("FantasyCrypto");
  const fantasyCrypto = await FantasyCrypto.deploy(
    uniteToken.address,
    treasuryAddress,
    insuranceAddress
  );
  await fantasyCrypto.deployed();

  console.log("Fantasy Crypto deployed to:", fantasyCrypto.address);

  // Set Fantasy Crypto as owner of UNITE token for reward distribution
  await uniteToken.transferOwnership(fantasyCrypto.address);
  console.log("UNITE Token ownership transferred to Fantasy Crypto contract");

  // Verify contracts on Arbiscan (if on mainnet)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await uniteToken.deployTransaction.wait(5);
    await fantasyCrypto.deployTransaction.wait(5);

    try {
      await hre.run("verify:verify", {
        address: uniteToken.address,
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: fantasyCrypto.address,
        constructorArguments: [
          uniteToken.address,
          treasuryAddress,
          insuranceAddress,
        ],
      });
    } catch (error) {
      console.error("Verification failed:", error);
    }
  }

  // Save deployment addresses to a file
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    uniteToken: uniteToken.address,
    fantasyCrypto: fantasyCrypto.address,
    treasury: treasuryAddress,
    insurance: insuranceAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    `deployments-${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployments-${hre.network.name}.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });