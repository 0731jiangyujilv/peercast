// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BetFactory} from "../src/BetFactory.sol";

/// @title DeployBetFactory - Deployment script for BetFactory
/// @notice Deploys BetFactory and configures initial supported tokens and operators
contract DeployBetFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address operator = vm.envAddress("OPERATOR_ADDRESS");
        address usdtAddress = vm.envAddress("USDT_ADDRESS");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        uint256 feeBps = vm.envOr("FEE_BPS", uint256(250)); // default 2.5%
        address feeRecipient = vm.envOr("FEE_RECIPIENT", msg.sender);

        vm.startBroadcast(deployerPrivateKey);

        BetFactory factory = new BetFactory();
        console.log("BetFactory deployed at:", address(factory));

        // Configure operator
        factory.setOperator(operator, true);
        console.log("Operator set:", operator);

        // Configure supported tokens
        if (usdtAddress != address(0)) {
            factory.setSupportedToken(usdtAddress, true);
            console.log("USDT supported:", usdtAddress);
        }
        if (usdcAddress != address(0)) {
            factory.setSupportedToken(usdcAddress, true);
            console.log("USDC supported:", usdcAddress);
        }

        // Configure Chainlink Data Feed price feeds (Base Sepolia)
        factory.setPriceFeed("BTC/USD", 0x0FB99723Aee6f420beAD13e6bBB79b7E6F034298);
        console.log("Price feed set: BTC/USD");

        factory.setPriceFeed("LINK/USD", 0xb113F5A928BCfF189C998ab20d753a47F9dE5A61);
        console.log("Price feed set: LINK/USD");

        // Configure fee
        if (feeBps > 0) {
            factory.setFee(feeBps, feeRecipient);
            console.log("Fee set:", feeBps, "bps, recipient:", feeRecipient);
        }

        vm.stopBroadcast();
    }
}
