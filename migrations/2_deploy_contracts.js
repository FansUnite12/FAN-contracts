let FansUniteToken = artifacts.require("./FansUniteToken.sol");
let FansUniteCrowdfund = artifacts.require("./FansUniteCrowdfund.sol");

module.exports = async (deployer) => {

    deployer.deploy(SafeMath);
    await deployer.deploy(FansUniteToken);
    await deployer.deploy(FansUniteCrowdfund, FansUniteToken.address);

    deployer.link(SafeMath, [FansUniteToken, FansUniteCrowdfund]);
};
