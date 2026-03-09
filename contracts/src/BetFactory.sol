// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBetFactory} from "./interfaces/IBetFactory.sol";
import {Bet} from "./Bet.sol";

/// @title BetFactory - Factory contract for creating 1v1 bet instances
/// @notice Deploys individual Bet contracts and tracks all created bets
/// @dev Only authorized operators can create bets (bot backend coordination)
contract BetFactory is IBetFactory, Ownable {
    /*//////////////////////////////////////////////////////////////
                              STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice Auto-incrementing bet ID counter
    uint256 public nextBetId;

    /// @notice Mapping from betId to deployed Bet contract address
    mapping(uint256 => address) public bets;

    /// @notice Addresses authorized to create bets (bot backend)
    mapping(address => bool) public operators;

    /// @notice Supported ERC20 tokens for betting
    mapping(address => bool) public supportedTokens;

    /// @notice Mapping from asset symbol (e.g. "BTC/USD") to Chainlink Data Feed address
    mapping(string => address) public priceFeeds;

    /// @notice List of supported asset symbols for enumeration
    string[] public supportedAssets;

    /// @notice Minimum bet duration in seconds (default: 3 minutes)
    uint256 public minDuration = 180;

    /// @notice Maximum bet duration in seconds (default: 7 days)
    uint256 public maxDuration = 604800;

    /// @notice Fee in basis points applied to bet winnings (e.g., 250 = 2.5%)
    uint256 public feeBps;

    /// @notice Address that receives collected fees
    address public feeRecipient;

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event OperatorUpdated(address indexed operator, bool authorized);
    event TokenUpdated(address indexed token, bool supported);
    event PriceFeedUpdated(string asset, address priceFeed);
    event DurationLimitsUpdated(uint256 minDuration, uint256 maxDuration);
    event FeeUpdated(uint256 feeBps, address feeRecipient);

    /*//////////////////////////////////////////////////////////////
                           CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Initializes the factory with the deployer as owner
    constructor() Ownable(msg.sender) {}

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOperator() {
        if (!operators[msg.sender] && msg.sender != owner()) {
            revert NotAuthorized();
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                       EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Creates a new 1v1 bet contract
    /// @param token ERC20 token address used for the bet
    /// @param amount Bet amount per participant (in token's smallest unit)
    /// @param duration Bet duration in seconds
    /// @param asset Asset symbol (e.g. "BTC/USD") — resolved to Chainlink Data Feed address
    /// @param participant1 First participant (UP side)
    /// @param participant2 Second participant (DOWN side)
    /// @return betId The unique ID assigned to this bet
    /// @return betContract The deployed Bet contract address
    function createPrediction(
        address token,
        uint256 amount,
        uint256 duration,
        string calldata asset,
        address participant1,
        address participant2
    ) external onlyOperator returns (uint256 betId, address betContract) {
        // Validations
        if (participant1 == address(0) || participant2 == address(0)) revert InvalidParticipants();
        if (participant1 == participant2) revert InvalidParticipants();
        if (amount == 0) revert InvalidAmount();
        if (duration < minDuration || duration > maxDuration) revert InvalidDuration();
        if (!supportedTokens[token]) revert InvalidToken();

        address priceFeed = priceFeeds[asset];
        if (priceFeed == address(0)) revert UnsupportedAsset();

        betId = nextBetId++;

        Bet bet = new Bet(token, amount, duration, priceFeed, participant1, participant2, feeBps, feeRecipient);
        betContract = address(bet);
        bets[betId] = betContract;

        emit BetCreated(betId, betContract, participant1, participant2, token, asset);
    }

    /// @notice Returns the Bet contract address for a given betId
    /// @param betId The ID of the bet to look up
    /// @return The address of the Bet contract
    function getBet(uint256 betId) external view returns (address) {
        return bets[betId];
    }

    /// @notice Returns the total number of bets created
    /// @return The current bet count
    function getBetCount() external view returns (uint256) {
        return nextBetId;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Adds or removes an authorized operator
    /// @param operator Address to update
    /// @param authorized Whether the address should be authorized
    function setOperator(address operator, bool authorized) external onlyOwner {
        operators[operator] = authorized;
        emit OperatorUpdated(operator, authorized);
    }

    /// @notice Adds or removes a supported betting token
    /// @param token ERC20 token address
    /// @param supported Whether the token should be supported
    function setSupportedToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenUpdated(token, supported);
    }

    /// @notice Sets or updates the Chainlink Data Feed address for an asset
    /// @param asset Asset symbol (e.g. "BTC/USD", "ETH/USD")
    /// @param feed Chainlink AggregatorV3Interface address (address(0) to remove)
    function setPriceFeed(string calldata asset, address feed) external onlyOwner {
        if (bytes(asset).length == 0) revert UnsupportedAsset();

        bool exists = priceFeeds[asset] != address(0);
        priceFeeds[asset] = feed;

        // Track in supportedAssets array for enumeration
        if (!exists && feed != address(0)) {
            supportedAssets.push(asset);
        }

        emit PriceFeedUpdated(asset, feed);
    }

    /// @notice Returns the Chainlink Data Feed address for a given asset
    /// @param asset Asset symbol to look up
    /// @return The Chainlink Data Feed address (address(0) if not supported)
    function getPriceFeed(string calldata asset) external view returns (address) {
        return priceFeeds[asset];
    }

    /// @notice Returns the number of supported assets
    /// @return The count of supported asset symbols
    function getSupportedAssetsCount() external view returns (uint256) {
        return supportedAssets.length;
    }

    /// @notice Updates the allowed bet duration range
    /// @param _minDuration New minimum duration in seconds
    /// @param _maxDuration New maximum duration in seconds
    function setDurationLimits(uint256 _minDuration, uint256 _maxDuration) external onlyOwner {
        require(_minDuration > 0 && _minDuration < _maxDuration, "Invalid duration limits");
        minDuration = _minDuration;
        maxDuration = _maxDuration;
        emit DurationLimitsUpdated(_minDuration, _maxDuration);
    }

    /// @notice Sets the fee configuration for new bets
    /// @param _feeBps Fee in basis points (max 1000 = 10%)
    /// @param _feeRecipient Address to receive fees
    function setFee(uint256 _feeBps, address _feeRecipient) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // Max 10%
        require(_feeBps == 0 || _feeRecipient != address(0), "Invalid fee recipient");
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
        emit FeeUpdated(_feeBps, _feeRecipient);
    }
}
