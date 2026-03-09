// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BetFactory} from "../src/BetFactory.sol";

/// @title DeployWorldChain - Deployment script for World Chain
/// @notice Deploys BetFactory and configures for World Chain mainnet
contract DeployWorldChain is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address operator = vm.envAddress("OPERATOR_ADDRESS");
        address usdcAddress = vm.envAddress("WORLD_USDC_ADDRESS");
        uint256 feeBps = vm.envOr("FEE_BPS", uint256(250)); // default 2.5%
        address feeRecipient = vm.envOr("FEE_RECIPIENT", msg.sender);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy BetFactory
        BetFactory factory = new BetFactory();
        console.log("BetFactory deployed at:", address(factory));

        // Configure operator
        factory.setOperator(operator, true);
        console.log("Operator set:", operator);

        // Configure USDC as supported token
        factory.setSupportedToken(usdcAddress, true);
        console.log("USDC supported:", usdcAddress);

        // Configure Chainlink Data Feed price feeds (World Chain Mainnet)
        // BTC/USD Price Feed on World Chain
        factory.setPriceFeed("BTC/USD", 0x0FB99723Aee6f420beAD13e6bBB79b7E6F034298);
        console.log("Price feed set: BTC/USD");

        // ETH/USD Price Feed on World Chain
        factory.setPriceFeed("ETH/USD", 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70);
        console.log("Price feed set: ETH/USD");

        // LINK/USD Price Feed on World Chain
        factory.setPriceFeed("LINK/USD", 0xb113F5A928BCfF189C998ab20d753a47F9dE5A61);
        console.log("Price feed set: LINK/USD");

        // Set duration limits (5 minutes to 7 days)
        factory.setDurationLimits(300, 604800);
        console.log("Duration limits set: 300s - 604800s");

        // Configure fee
        factory.setFee(feeBps, feeRecipient);
        console.log("Fee set:", feeBps, "bps, recipient:", feeRecipient);

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Network: World Chain Mainnet (Chain ID: 480)");
        console.log("BetFactory:", address(factory));
        console.log("Operator:", operator);
        console.log("USDC:", usdcAddress);
        console.log("Fee:", feeBps, "bps");
        console.log("Fee Recipient:", feeRecipient);
        console.log("\nNext steps:");
        console.log("1. Update .env.local in my-first-mini-app:");
        console.log("   NEXT_PUBLIC_BET_FACTORY_ADDRESS=", address(factory));
        console.log("   NEXT_PUBLIC_USDC_ADDRESS=", usdcAddress);
        console.log("2. Update bot/.env with the same addresses");
        console.log("3. Verify contract on Worldscan (optional)");
    }
}
