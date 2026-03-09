// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IBetFactory - Interface for the Bet Factory contract
/// @notice Defines the external interface for creating and managing bets
interface IBetFactory {
    event BetCreated(
        uint256 indexed betId, address betContract, address participant1, address participant2, address token, string asset
    );

    error InvalidParticipants();
    error InvalidAmount();
    error InvalidDuration();
    error InvalidPriceFeed();
    error UnsupportedAsset();
    error InvalidToken();
    error NotAuthorized();

    function createPrediction(
        address token,
        uint256 amount,
        uint256 duration,
        string calldata asset,
        address participant1,
        address participant2
    ) external returns (uint256 betId, address betContract);

    function getBet(uint256 betId) external view returns (address);
    function getBetCount() external view returns (uint256);
    function getPriceFeed(string calldata asset) external view returns (address);
}
