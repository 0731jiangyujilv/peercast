// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {PeercastPoR} from "../src/PeercastPoR.sol";

contract DeployPeercastPoR is Script {
    // Base Sepolia Forwarder address
    address constant FORWARDER_ADDRESS = 0x82300bd7c3958625581cc2F77bC6464dcEcDF3e5;

    function run() external returns (PeercastPoR) {
        vm.startBroadcast();

        PeercastPoR por = new PeercastPoR(FORWARDER_ADDRESS);

        vm.stopBroadcast();

        return por;
    }
}
