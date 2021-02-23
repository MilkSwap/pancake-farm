// Script to deploy the milkswap farm contracts
const { BigNumber } = require("@ethersproject/bignumber");
const MasterChef = artifacts.require("MasterChef");
const SousChef = artifacts.require("SousChef");
const MilkToken = artifacts.require("MilkToken");
const FoamBar = artifacts.require("FoamBar");
const Timelock = artifacts.require("Timelock");
const BnbStaking = artifacts.require("BnbStaking");

// Milk token initial supply to mint (to us) - note that the milk token will mint 2500 tokens to ourselves on creation for the meme and airdrop
const INITIAL_MINT = '25000'; // <------------------------

// Developer address
const DEV_ADDR = ''; // change this to our account <------------------------

// Reward starting block
const BLOCKS_PER_HOUR = (3600 / 3) // 3sec Block Time
const BLOCKS_PER_DAY = 24 * BLOCKS_PER_HOUR
const STARTING_BLOCK = 12345; // change this to the proper starting block <------------------------
const REWARDS_START = String(STARTING_BLOCK + (BLOCKS_PER_HOUR * 6))

// MasterChef variables
const MILK_TOKENS_PER_BLOCK = '10'; // <------------------------
const STARTING_MULTIPLIER = 4; // <------------------------

// Souschef variables
const FOAM_TOKENS_PER_BLOCK = '10'; // <------------------------

// timelock
const TIMELOCK_DELAY_SECS = (3600 * 24); // <------------------------ this is a 24h timelock

const logTx = (tx) => {
    console.dir(tx, {depth: 3});
}

// let block = await web3.eth.getBlock("latest")
module.exports = async function(deployer, network, accounts) {
    console.log({network});

    let currentAccount = accounts[0]; // <------------------------ will take the first account generated by the mnemonic
    let devAddr = DEV_ADDR;

    if (network == 'testnet') {
        console.log(`WARNING: Updating current account for testnet`)
        currentAccount = accounts[1];
    }

    if (network == 'development' || network == 'testnet') {
        console.log(`WARNING: Updating feeAcount for testnet/development`)
        feeAccount = accounts[3];
    }

    let milkTokenInstance;
    let foamBarInstance;
    let masterChefInstance;

    /**
     * Deploy BananaToken
     */
    deployer.deploy(MilkToken, devAddr).then((instance) => {
        milkTokenInstance = instance;
        /**
         * Mint intial tokens for liquidity pool
         */
        return milkTokenInstance.mint(devAddr, BigNumber.from(INITIAL_MINT).mul(BigNumber.from(String(10**18))));
    }).then((tx)=> {
        logTx(tx);
        /**
         * Deploy FoamBar
         */
        return deployer.deploy(FoamBar, MilkToken.address)
    }).then((instance)=> {
        foamBarInstance = instance;
        /**
         * Deploy MasterChef
         */
        if(network == "bsc" || network == "bsc-fork") {
            console.log(`Deploying MasterChef with BSC MAINNET settings.`)
            return deployer.deploy(MasterChef,
                MilkToken.address,                                                          // _milk
                FoamBar.address,                                                            // _foam
                devAddr,                                                                    // _devaddr
                BigNumber.from(MILK_TOKENS_PER_BLOCK).mul(BigNumber.from(String(10**18))),  // _milkPerBlock
                REWARDS_START,                                                              // _startBlock
                STARTING_MULTIPLIER                                                         // _multiplier
            )
        }
        console.log(`Deploying MasterChef with DEV/TEST settings`)
        return deployer.deploy(MasterChef,
            MilkToken.address,
            FoamBar.address,
            devAddr,
            BigNumber.from(MILK_TOKENS_PER_BLOCK).mul(BigNumber.from(String(10**18))),
            0,
            4
        )

    }).then((instance)=> {
        masterChefInstance = instance;
        /**
         * TransferOwnership of MILK to MasterChef
         */
        return milkTokenInstance.transferOwnership(MasterChef.address);
    }).then((tx)=> {
        logTx(tx);
        /**
         * TransferOwnership of FOAM to MasterChef
         */
        return foamBarInstance.transferOwnership(MasterChef.address);
    }).then((tx)=> {
        logTx(tx);
        /**
         * Deploy SousChef
         */
        if(network == "bsc" || network == "bsc-fork") {
            console.log(`Deploying SousChef with BSC MAINNET settings.`)
            return deployer.deploy(SousChef,
                FoamBar.address,                                                            //_foamBar
                BigNumber.from(FOAM_TOKENS_PER_BLOCK).mul(BigNumber.from(String(10**18))),  // _rewardPerBlock
                REWARDS_START,                                                              // _startBlock
                STARTING_BLOCK + (BLOCKS_PER_DAY * 365),                                    // _endBlock
            )
        }
        console.log(`Deploying SousChef with DEV/TEST settings`)
        return deployer.deploy(SousChef,
            FoamBar.address,                                                                //_bananaSplit
            BigNumber.from(FOAM_TOKENS_PER_BLOCK).mul(BigNumber.from(String(10**18))),      // _rewardPerBlock
            STARTING_BLOCK + (BLOCKS_PER_HOUR * 6),                                         // _startBlock
            '99999999999999999',                                                            // _endBlock
        )
    }).then(()=> {
        /**
         * Deploy BnbStakingContract
         */
                // TODO:
        // constructor(
        //     IBEP20 _lp,
        //     IBEP20 _rewardToken,
        //     uint256 _rewardPerBlock,
        //     uint256 _startBlock,
        //     uint256 _bonusEndBlock,
        //     address _adminAddress,
        //     address _wbnb
        // )
        if(network == "bsc" || network == "bsc-fork") {

        }

        // return deployer.deploy(BnbStaking, BananaToken.address)
    }).then(()=> {
        /**
         * Deploy MultiCall
         */
        //return deployer.deploy(MultiCall);
    }).then(()=> {
        /**
         * Deploy Timelock
         */
        return deployer.deploy(Timelock, currentAccount, TIMELOCK_DELAY_SECS);
    }).then(() => {
        /**
         * Transfer Ownership of MasterChef to the timelock
         */
        //return masterChefInstance.transferOwnership(Timelock.address);
    }).then(()=> {
        console.log('Rewards Start at block: ', REWARDS_START)
        console.table({
            MasterChef:MasterChef.address,
            SousChef:SousChef.address,
            MilkToken:MilkToken.address,
            FoamBar:FoamBar.address,
            //MultiCall:MultiCall.address,
            Timelock:Timelock.address,
            // ApeSwapBurn:ApeSwapBurn.address
            // BnbStaking:BnbStaking.address,
        })
    });
};
