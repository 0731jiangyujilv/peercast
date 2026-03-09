// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ReceiverTemplate} from "./interfaces/ReceiverTemplate.sol";

/// @title PeercastPoR - Proof of Reserve contract for Peercast betting platform
/// @notice Stores verified statistics and leaderboard data from Chainlink CRE
contract PeercastPoR is ReceiverTemplate {
    
    struct PoRData {
        uint256 totalBets;
        uint256 activeBets;
        uint256 settledBets;
        uint256 totalVolume;
        uint256 topPlayerProfit;
        bool isValid;
        uint256 timestamp;
        uint256 updateCount;
    }

    PoRData public latestData;
    mapping(uint256 => PoRData) public historicalData;
    uint256 public updateCounter;

    event PoRUpdated(
        uint256 indexed updateId,
        uint256 totalBets,
        uint256 activeBets,
        uint256 settledBets,
        uint256 totalVolume,
        uint256 topPlayerProfit,
        bool isValid,
        uint256 timestamp
    );

    constructor(address forwarderAddress) ReceiverTemplate(forwarderAddress) {}

    function _processReport(bytes calldata report) internal override {
        (
            uint256 totalBets,
            uint256 activeBets,
            uint256 settledBets,
            uint256 totalVolume,
            uint256 topPlayerProfit,
            bool isValid,
            uint256 timestamp
        ) = abi.decode(report, (uint256, uint256, uint256, uint256, uint256, bool, uint256));

        updateCounter++;

        PoRData memory newData = PoRData({
            totalBets: totalBets,
            activeBets: activeBets,
            settledBets: settledBets,
            totalVolume: totalVolume,
            topPlayerProfit: topPlayerProfit,
            isValid: isValid,
            timestamp: timestamp,
            updateCount: updateCounter
        });

        latestData = newData;
        historicalData[updateCounter] = newData;

        emit PoRUpdated(
            updateCounter,
            totalBets,
            activeBets,
            settledBets,
            totalVolume,
            topPlayerProfit,
            isValid,
            timestamp
        );
    }

    function getLatestData() external view returns (PoRData memory) {
        return latestData;
    }

    function getHistoricalData(uint256 updateId) external view returns (PoRData memory) {
        return historicalData[updateId];
    }

    function getTotalUpdates() external view returns (uint256) {
        return updateCounter;
    }
}
