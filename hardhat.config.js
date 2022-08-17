require("@nomiclabs/hardhat-waffle");
require('dotenv').config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: "0.8.4",
  networks: {
  optimismGoerli: { // to deploy on this network: npx hardhat run scripts/deploy.js --network optimismGoerli (and etc for other networks if we add anymore)
    url: process.env.OPTIMISM_GOERLI_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
},
};
