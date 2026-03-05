// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {BetFactory} from "../src/BetFactory.sol";
import {Bet} from "../src/Bet.sol";
import {IBetFactory} from "../src/interfaces/IBetFactory.sol";
import {IBet} from "../src/interfaces/IBet.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockAggregator} from "./mocks/MockAggregator.sol";

contract BetFactoryTest is Test {
    BetFactory public factory;
    MockERC20 public token;
    MockAggregator public priceFeed;

    address public owner = makeAddr("owner");
    address public operator = makeAddr("operator");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    uint256 public constant BET_AMOUNT = 100e6;
    uint256 public constant BET_DURATION = 300; // 5 minutes
    int256 public constant INITIAL_PRICE = 62_000e8;

    function setUp() public {
        vm.startPrank(owner);
        factory = new BetFactory();
        token = new MockERC20("Mock USDT", "USDT", 6);
        priceFeed = new MockAggregator(INITIAL_PRICE, 8);

        factory.setOperator(operator, true);
        factory.setSupportedToken(address(token), true);
        factory.setPriceFeed("BTC/USD", address(priceFeed));
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_constructor() public view {
        assertEq(factory.owner(), owner);
        assertEq(factory.nextBetId(), 0);
        assertEq(factory.minDuration(), 180);
        assertEq(factory.maxDuration(), 604800);
    }

    /*//////////////////////////////////////////////////////////////
                        CREATE BET TESTS
    //////////////////////////////////////////////////////////////*/

    function test_createBet() public {
        vm.prank(operator);
        (uint256 betId, address betContract) =
            factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, bob);

        assertEq(betId, 0);
        assertTrue(betContract != address(0));
        assertEq(factory.getBet(0), betContract);
        assertEq(factory.nextBetId(), 1);
        assertEq(factory.getBetCount(), 1);

        // Verify the deployed Bet contract
        Bet bet = Bet(betContract);
        assertEq(bet.participant1(), alice);
        assertEq(bet.participant2(), bob);
        assertEq(address(bet.token()), address(token));
        assertEq(bet.amount(), BET_AMOUNT);
        assertEq(bet.duration(), BET_DURATION);
        assertEq(address(bet.priceFeed()), address(priceFeed));
    }

    function test_createBet_ownerCanCreate() public {
        vm.prank(owner);
        (uint256 betId,) =
            factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, bob);
        assertEq(betId, 0);
    }

    function test_createBet_incrementsId() public {
        vm.startPrank(operator);

        (uint256 id1,) = factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, bob);
        (uint256 id2,) =
            factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, charlie);

        assertEq(id1, 0);
        assertEq(id2, 1);
        assertEq(factory.getBetCount(), 2);
        vm.stopPrank();
    }

    function test_createBet_emitsEvent() public {
        vm.prank(operator);

        vm.expectEmit(true, false, false, false);
        emit IBetFactory.BetCreated(0, address(0), alice, bob, address(token), "BTC/USD");

        factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, bob);
    }

    function test_createBet_revertNotAuthorized() public {
        vm.expectRevert(IBetFactory.NotAuthorized.selector);
        vm.prank(charlie);
        factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, bob);
    }

    function test_createBet_revertZeroParticipant1() public {
        vm.expectRevert(IBetFactory.InvalidParticipants.selector);
        vm.prank(operator);
        factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", address(0), bob);
    }

    function test_createBet_revertZeroParticipant2() public {
        vm.expectRevert(IBetFactory.InvalidParticipants.selector);
        vm.prank(operator);
        factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, address(0));
    }

    function test_createBet_revertSameParticipants() public {
        vm.expectRevert(IBetFactory.InvalidParticipants.selector);
        vm.prank(operator);
        factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, alice);
    }

    function test_createBet_revertZeroAmount() public {
        vm.expectRevert(IBetFactory.InvalidAmount.selector);
        vm.prank(operator);
        factory.createBet(address(token), 0, BET_DURATION, "BTC/USD", alice, bob);
    }

    function test_createBet_revertDurationTooShort() public {
        vm.expectRevert(IBetFactory.InvalidDuration.selector);
        vm.prank(operator);
        factory.createBet(address(token), BET_AMOUNT, 60, "BTC/USD", alice, bob); // 1 min < 3 min
    }

    function test_createBet_revertDurationTooLong() public {
        vm.expectRevert(IBetFactory.InvalidDuration.selector);
        vm.prank(operator);
        factory.createBet(address(token), BET_AMOUNT, 604801, "BTC/USD", alice, bob); // > 7 days
    }

    function test_createBet_revertUnsupportedAsset() public {
        vm.expectRevert(IBetFactory.UnsupportedAsset.selector);
        vm.prank(operator);
        factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "DOGE/USD", alice, bob);
    }

    function test_createBet_revertUnsupportedToken() public {
        MockERC20 unsupported = new MockERC20("Bad", "BAD", 18);
        vm.expectRevert(IBetFactory.InvalidToken.selector);
        vm.prank(operator);
        factory.createBet(address(unsupported), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, bob);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_setOperator() public {
        vm.prank(owner);
        factory.setOperator(charlie, true);
        assertTrue(factory.operators(charlie));

        vm.prank(owner);
        factory.setOperator(charlie, false);
        assertFalse(factory.operators(charlie));
    }

    function test_setOperator_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit BetFactory.OperatorUpdated(charlie, true);

        vm.prank(owner);
        factory.setOperator(charlie, true);
    }

    function test_setOperator_revertNotOwner() public {
        vm.expectRevert();
        vm.prank(charlie);
        factory.setOperator(charlie, true);
    }

    function test_setSupportedToken() public {
        MockERC20 newToken = new MockERC20("USDC", "USDC", 6);

        vm.prank(owner);
        factory.setSupportedToken(address(newToken), true);
        assertTrue(factory.supportedTokens(address(newToken)));

        vm.prank(owner);
        factory.setSupportedToken(address(newToken), false);
        assertFalse(factory.supportedTokens(address(newToken)));
    }

    function test_setSupportedToken_emitsEvent() public {
        MockERC20 newToken = new MockERC20("USDC", "USDC", 6);

        vm.expectEmit(true, false, false, true);
        emit BetFactory.TokenUpdated(address(newToken), true);

        vm.prank(owner);
        factory.setSupportedToken(address(newToken), true);
    }

    /*//////////////////////////////////////////////////////////////
                       PRICE FEED TESTS
    //////////////////////////////////////////////////////////////*/

    function test_setPriceFeed() public {
        MockAggregator ethFeed = new MockAggregator(3000e8, 8);

        vm.prank(owner);
        factory.setPriceFeed("ETH/USD", address(ethFeed));

        assertEq(factory.priceFeeds("ETH/USD"), address(ethFeed));
        assertEq(factory.getPriceFeed("ETH/USD"), address(ethFeed));
        assertEq(factory.getSupportedAssetsCount(), 2); // BTC/USD from setUp + ETH/USD
    }

    function test_setPriceFeed_emitsEvent() public {
        MockAggregator ethFeed = new MockAggregator(3000e8, 8);

        vm.expectEmit(false, false, false, true);
        emit BetFactory.PriceFeedUpdated("ETH/USD", address(ethFeed));

        vm.prank(owner);
        factory.setPriceFeed("ETH/USD", address(ethFeed));
    }

    function test_setPriceFeed_revertEmptyAsset() public {
        vm.expectRevert(IBetFactory.UnsupportedAsset.selector);
        vm.prank(owner);
        factory.setPriceFeed("", address(priceFeed));
    }

    function test_setPriceFeed_revertNotOwner() public {
        vm.expectRevert();
        vm.prank(charlie);
        factory.setPriceFeed("ETH/USD", address(priceFeed));
    }

    function test_setPriceFeed_updateExisting() public {
        MockAggregator newFeed = new MockAggregator(70_000e8, 8);

        vm.prank(owner);
        factory.setPriceFeed("BTC/USD", address(newFeed));

        assertEq(factory.priceFeeds("BTC/USD"), address(newFeed));
        assertEq(factory.getSupportedAssetsCount(), 1); // Should not duplicate
    }

    function test_setPriceFeed_remove() public {
        vm.prank(owner);
        factory.setPriceFeed("BTC/USD", address(0));

        assertEq(factory.priceFeeds("BTC/USD"), address(0));
    }

    function test_getPriceFeed_nonExistent() public view {
        assertEq(factory.getPriceFeed("DOGE/USD"), address(0));
    }

    function test_setDurationLimits() public {
        vm.prank(owner);
        factory.setDurationLimits(120, 86400);

        assertEq(factory.minDuration(), 120);
        assertEq(factory.maxDuration(), 86400);
    }

    function test_setDurationLimits_emitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit BetFactory.DurationLimitsUpdated(120, 86400);

        vm.prank(owner);
        factory.setDurationLimits(120, 86400);
    }

    function test_setDurationLimits_revertInvalid() public {
        vm.expectRevert();
        vm.prank(owner);
        factory.setDurationLimits(0, 100);

        vm.expectRevert();
        vm.prank(owner);
        factory.setDurationLimits(100, 50); // min > max
    }

    function test_setDurationLimits_revertNotOwner() public {
        vm.expectRevert();
        vm.prank(charlie);
        factory.setDurationLimits(120, 86400);
    }

    /*//////////////////////////////////////////////////////////////
                         GETTER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_getBet_returnsZeroForNonExistent() public view {
        assertEq(factory.getBet(999), address(0));
    }

    /*//////////////////////////////////////////////////////////////
                       INTEGRATION TEST
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                           FEE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_setFee() public {
        vm.prank(owner);
        factory.setFee(250, alice);

        assertEq(factory.feeBps(), 250);
        assertEq(factory.feeRecipient(), alice);
    }

    function test_setFee_emitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit BetFactory.FeeUpdated(250, alice);

        vm.prank(owner);
        factory.setFee(250, alice);
    }

    function test_setFee_revertTooHigh() public {
        vm.expectRevert();
        vm.prank(owner);
        factory.setFee(1001, alice);
    }

    function test_setFee_revertNoRecipient() public {
        vm.expectRevert();
        vm.prank(owner);
        factory.setFee(250, address(0));
    }

    function test_setFee_revertNotOwner() public {
        vm.expectRevert();
        vm.prank(charlie);
        factory.setFee(250, alice);
    }

    function test_setFee_zeroAllowed() public {
        vm.prank(owner);
        factory.setFee(0, address(0));

        assertEq(factory.feeBps(), 0);
        assertEq(factory.feeRecipient(), address(0));
    }

    function test_createBet_passesFeeToBet() public {
        address feeCollector = makeAddr("feeCollector");
        vm.prank(owner);
        factory.setFee(300, feeCollector);

        vm.prank(operator);
        (, address betContract) =
            factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, bob);

        Bet bet = Bet(betContract);
        assertEq(bet.feeBps(), 300);
        assertEq(bet.feeRecipient(), feeCollector);
    }

    /*//////////////////////////////////////////////////////////////
                       INTEGRATION TEST
    //////////////////////////////////////////////////////////////*/

    function test_fullLifecycle() public {
        // Set fee
        address feeCollector = makeAddr("feeCollector");
        vm.prank(owner);
        factory.setFee(250, feeCollector); // 2.5%

        // Create bet
        vm.prank(operator);
        (uint256 betId, address betContract) =
            factory.createBet(address(token), BET_AMOUNT, BET_DURATION, "BTC/USD", alice, bob);

        Bet bet = Bet(betContract);

        // Fund and approve
        token.mint(alice, BET_AMOUNT);
        token.mint(bob, BET_AMOUNT);
        vm.prank(alice);
        token.approve(betContract, BET_AMOUNT);
        vm.prank(bob);
        token.approve(betContract, BET_AMOUNT);

        // Deposit
        vm.prank(alice);
        bet.deposit();
        vm.prank(bob);
        bet.deposit();

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Locked));

        // Settle (price goes up)
        vm.warp(bet.endTime());
        priceFeed.setPrice(INITIAL_PRICE + 500e8);
        bet.settle();

        uint256 totalPot = BET_AMOUNT * 2;
        uint256 fee = (totalPot * 250) / 10_000;
        uint256 payout = totalPot - fee;

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Settled));
        assertEq(bet.winner(), alice);
        assertEq(token.balanceOf(alice), payout);
        assertEq(token.balanceOf(bob), 0);
        assertEq(token.balanceOf(feeCollector), fee);

        // Verify factory tracking
        assertEq(factory.getBet(betId), betContract);
        assertEq(factory.getBetCount(), 1);
    }
}
