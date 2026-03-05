// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {IBet} from "./interfaces/IBet.sol";
import {AutomationCompatibleInterface} from "./interfaces/AutomationCompatibleInterface.sol";

/// @title Bet - Individual 1v1 price bet contract
/// @notice Each instance represents a single bet between two participants
/// @dev Created by BetFactory. Settlement triggered by Chainlink Automation.
contract Bet is IBet, AutomationCompatibleInterface, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Maximum allowed staleness for oracle price data (1 hour)
    uint256 public constant MAX_ORACLE_STALENESS = 3600;

    /// @notice Timeout for participants to deposit after bet creation
    uint256 public constant DEPOSIT_TIMEOUT = 1800; // 30 minutes

    /// @notice Timelock duration before emergency withdraw is allowed
    uint256 public constant EMERGENCY_TIMELOCK = 86400; // 24 hours after endTime

    /*//////////////////////////////////////////////////////////////
                          IMMUTABLE STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice First participant (the bet creator's counterparty)
    address public immutable participant1;

    /// @notice Second participant (the challenger)
    address public immutable participant2;

    /// @notice ERC20 token used for betting (e.g., USDT, USDC)
    IERC20 public immutable token;

    /// @notice Bet amount per participant
    uint256 public immutable amount;

    /// @notice Duration of the bet in seconds
    uint256 public immutable duration;

    /// @notice Chainlink Data Feed for the target asset price
    AggregatorV3Interface public immutable priceFeed;

    /// @notice Factory contract that created this bet
    address public immutable factory;

    /// @notice Timestamp when the bet contract was created
    uint256 public immutable createdAt;

    /// @notice Fee in basis points (e.g., 250 = 2.5%)
    uint256 public immutable feeBps;

    /// @notice Address that receives the fee
    address public immutable feeRecipient;

    /*//////////////////////////////////////////////////////////////
                          MUTABLE STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice Recorded start price from Chainlink Data Feed
    int256 public startPrice;

    /// @notice Recorded end price from Chainlink Data Feed
    int256 public endPrice;

    /// @notice Timestamp when bet was locked (both deposited)
    uint256 public startTime;

    /// @notice Timestamp when bet expires and settlement can occur
    uint256 public endTime;

    /// @notice Current status of the bet
    BetStatus public status;

    /// @notice Address of the winner (zero if not settled or refund)
    address public winner;

    /// @notice Tracks whether each participant has deposited
    mapping(address => bool) public hasDeposited;

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Creates a new bet instance
    /// @param _token ERC20 token address for betting
    /// @param _amount Bet amount per participant
    /// @param _duration Bet duration in seconds
    /// @param _priceFeed Chainlink Data Feed address
    /// @param _participant1 First participant address
    /// @param _participant2 Second participant address
    /// @param _feeBps Fee in basis points (max 1000 = 10%)
    /// @param _feeRecipient Address to receive fees
    constructor(
        address _token,
        uint256 _amount,
        uint256 _duration,
        address _priceFeed,
        address _participant1,
        address _participant2,
        uint256 _feeBps,
        address _feeRecipient
    ) {
        if (_feeBps > 1000) revert InvalidFee(); // Max 10%
        token = IERC20(_token);
        amount = _amount;
        duration = _duration;
        priceFeed = AggregatorV3Interface(_priceFeed);
        participant1 = _participant1;
        participant2 = _participant2;
        factory = msg.sender;
        createdAt = block.timestamp;
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
        status = BetStatus.Created;
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyParticipant() {
        if (msg.sender != participant1 && msg.sender != participant2) {
            revert NotParticipant();
        }
        _;
    }

    modifier inStatus(BetStatus _status) {
        if (status != _status) {
            revert InvalidStatus();
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                         EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Allows a participant to deposit their bet amount
    /// @dev Both participants must deposit before the bet locks.
    ///      Automatically locks the bet and records start price when both have deposited.
    function deposit() external nonReentrant onlyParticipant inStatus(BetStatus.Created) {
        if (hasDeposited[msg.sender]) revert AlreadyDeposited();
        if (block.timestamp > createdAt + DEPOSIT_TIMEOUT) revert DepositTimeout();

        hasDeposited[msg.sender] = true;
        token.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount);

        // Auto-lock when both participants have deposited
        if (hasDeposited[participant1] && hasDeposited[participant2]) {
            _lockBet();
        }
    }

    /// @notice Settles the bet after the duration has elapsed
    /// @dev Can be called by anyone (designed for Chainlink Automation).
    ///      Reads the end price from Chainlink Data Feed and distributes funds.
    function settle() external nonReentrant {
        _settle();
    }

    /// @notice Cancels the bet and refunds deposited funds
    /// @dev Can only be called when bet is in Created status and deposit timeout has passed,
    ///      OR by a participant before the other has deposited.
    function cancel() external nonReentrant {
        _cancel();
    }

    /// @notice Emergency withdrawal for oracle failure scenarios
    /// @dev Only available after endTime + EMERGENCY_TIMELOCK, and only if bet is still Locked
    function emergencyWithdraw() external nonReentrant onlyParticipant inStatus(BetStatus.Locked) {
        if (block.timestamp < endTime + EMERGENCY_TIMELOCK) revert TimelockNotExpired();

        status = BetStatus.Cancelled;

        token.safeTransfer(participant1, amount);
        token.safeTransfer(participant2, amount);

        emit EmergencyWithdraw(participant1, amount);
        emit EmergencyWithdraw(participant2, amount);
    }

    /// @notice Returns all bet information in a single call
    /// @return info BetInfo struct with all bet details
    function getBetInfo() external view returns (BetInfo memory info) {
        info = BetInfo({
            participant1: participant1,
            participant2: participant2,
            token: address(token),
            amount: amount,
            duration: duration,
            priceFeed: address(priceFeed),
            startPrice: startPrice,
            endPrice: endPrice,
            startTime: startTime,
            endTime: endTime,
            status: status,
            winner: winner,
            feeBps: feeBps,
            feeRecipient: feeRecipient
        });
    }

    /*//////////////////////////////////////////////////////////////
                     CHAINLINK AUTOMATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Called by Chainlink Automation to check if upkeep is needed
    /// @dev Returns true if: (1) Locked and endTime passed → settle, or (2) Created and deposit timeout passed → cancel
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        if (status == BetStatus.Locked && block.timestamp >= endTime) {
            return (true, abi.encode(uint8(0))); // 0 = settle
        }
        if (status == BetStatus.Created && block.timestamp > createdAt + DEPOSIT_TIMEOUT) {
            return (true, abi.encode(uint8(1))); // 1 = cancel
        }
        return (false, "");
    }

    /// @notice Called by Chainlink Automation to perform the upkeep
    /// @param performData Encoded action: 0 = settle, 1 = cancel
    function performUpkeep(bytes calldata performData) external override nonReentrant {
        uint8 action = abi.decode(performData, (uint8));
        if (action == 0) {
            _settle();
        } else if (action == 1) {
            _cancel();
        }
    }

    /*//////////////////////////////////////////////////////////////
                         INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Internal settle logic
    function _settle() internal inStatus(BetStatus.Locked) {
        if (block.timestamp < endTime) revert BetNotExpired();

        (int256 price, uint256 updatedAt) = _getLatestPrice();
        if (block.timestamp - updatedAt > MAX_ORACLE_STALENESS) revert OracleStalePrice();

        endPrice = price;
        status = BetStatus.Settled;

        uint256 totalPot = amount * 2;
        uint256 fee = (feeBps > 0 && feeRecipient != address(0)) ? (totalPot * feeBps) / 10_000 : 0;
        uint256 payout = totalPot - fee;

        if (endPrice > startPrice) {
            // Price went UP — participant1 wins (convention: participant1 = UP side)
            winner = participant1;
            token.safeTransfer(participant1, payout);
        } else if (endPrice < startPrice) {
            // Price went DOWN — participant2 wins
            winner = participant2;
            token.safeTransfer(participant2, payout);
        } else {
            // Equal price — refund both (no fee on refund)
            winner = address(0);
            token.safeTransfer(participant1, amount);
            token.safeTransfer(participant2, amount);
            fee = 0;
        }

        if (fee > 0) {
            token.safeTransfer(feeRecipient, fee);
            emit FeesCollected(feeRecipient, fee);
        }

        emit BetSettled(winner, endPrice);
    }

    /// @notice Internal cancel logic
    function _cancel() internal inStatus(BetStatus.Created) {
        // Anyone can cancel after deposit timeout
        bool timeoutReached = block.timestamp > createdAt + DEPOSIT_TIMEOUT;
        // A participant can cancel if the other hasn't deposited yet
        bool isParticipantAddr = msg.sender == participant1 || msg.sender == participant2;

        if (!timeoutReached && !isParticipantAddr) {
            revert NotParticipant();
        }

        // If timeout not reached, participant can only cancel if opponent hasn't deposited
        if (!timeoutReached && isParticipantAddr) {
            address opponent = msg.sender == participant1 ? participant2 : participant1;
            if (hasDeposited[opponent]) {
                // Both sides need to have a chance to deposit; only cancel via timeout
                revert DepositTimeout();
            }
        }

        status = BetStatus.Cancelled;

        // Refund anyone who deposited
        if (hasDeposited[participant1]) {
            token.safeTransfer(participant1, amount);
        }
        if (hasDeposited[participant2]) {
            token.safeTransfer(participant2, amount);
        }

        emit BetCancelled();
    }

    /// @notice Locks the bet: records start price and starts the countdown
    /// @dev Called internally when both participants have deposited
    function _lockBet() internal {
        (int256 price, uint256 updatedAt) = _getLatestPrice();
        if (block.timestamp - updatedAt > MAX_ORACLE_STALENESS) revert OracleStalePrice();

        startPrice = price;
        startTime = block.timestamp;
        endTime = block.timestamp + duration;
        status = BetStatus.Locked;

        emit BetLocked(startPrice, startTime, endTime);
    }

    /// @notice Fetches the latest price from the Chainlink Data Feed
    /// @return price The latest price
    /// @return updatedAt Timestamp of the last price update
    function _getLatestPrice() internal view returns (int256 price, uint256 updatedAt) {
        (, price,, updatedAt,) = priceFeed.latestRoundData();
        if (price <= 0) revert OracleInvalidPrice();
    }
}
