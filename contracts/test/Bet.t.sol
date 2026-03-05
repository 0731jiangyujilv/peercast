// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Bet} from "../src/Bet.sol";
import {IBet} from "../src/interfaces/IBet.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockAggregator} from "./mocks/MockAggregator.sol";

contract BetTest is Test {
    Bet public bet;
    MockERC20 public token;
    MockAggregator public priceFeed;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    address public feeCollector = makeAddr("feeCollector");

    uint256 public constant BET_AMOUNT = 100e6; // 100 USDT (6 decimals)
    uint256 public constant BET_DURATION = 300; // 5 minutes
    int256 public constant INITIAL_PRICE = 62_000e8; // $62,000 (8 decimals)
    uint256 public constant FEE_BPS = 250; // 2.5%

    function setUp() public {
        token = new MockERC20("Mock USDT", "USDT", 6);
        priceFeed = new MockAggregator(INITIAL_PRICE, 8);

        bet = new Bet(
            address(token),
            BET_AMOUNT,
            BET_DURATION,
            address(priceFeed),
            alice,
            bob,
            FEE_BPS,
            feeCollector
        );

        // Fund participants
        token.mint(alice, BET_AMOUNT * 10);
        token.mint(bob, BET_AMOUNT * 10);

        // Approve bet contract
        vm.prank(alice);
        token.approve(address(bet), type(uint256).max);
        vm.prank(bob);
        token.approve(address(bet), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                        CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_constructor() public view {
        assertEq(bet.participant1(), alice);
        assertEq(bet.participant2(), bob);
        assertEq(address(bet.token()), address(token));
        assertEq(bet.amount(), BET_AMOUNT);
        assertEq(bet.duration(), BET_DURATION);
        assertEq(address(bet.priceFeed()), address(priceFeed));
        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Created));
        assertEq(bet.winner(), address(0));
        assertEq(bet.feeBps(), FEE_BPS);
        assertEq(bet.feeRecipient(), feeCollector);
    }

    function test_constructor_revertFeeTooHigh() public {
        vm.expectRevert(IBet.InvalidFee.selector);
        new Bet(address(token), BET_AMOUNT, BET_DURATION, address(priceFeed), alice, bob, 1001, feeCollector);
    }

    /*//////////////////////////////////////////////////////////////
                          DEPOSIT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_deposit_participant1() public {
        vm.prank(alice);
        bet.deposit();

        assertTrue(bet.hasDeposited(alice));
        assertFalse(bet.hasDeposited(bob));
        assertEq(token.balanceOf(address(bet)), BET_AMOUNT);
        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Created));
    }

    function test_deposit_participant2() public {
        vm.prank(bob);
        bet.deposit();

        assertFalse(bet.hasDeposited(alice));
        assertTrue(bet.hasDeposited(bob));
        assertEq(token.balanceOf(address(bet)), BET_AMOUNT);
    }

    function test_deposit_bothLocksBet() public {
        vm.prank(alice);
        bet.deposit();

        vm.prank(bob);
        bet.deposit();

        assertTrue(bet.hasDeposited(alice));
        assertTrue(bet.hasDeposited(bob));
        assertEq(token.balanceOf(address(bet)), BET_AMOUNT * 2);
        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Locked));
        assertEq(bet.startPrice(), INITIAL_PRICE);
        assertGt(bet.startTime(), 0);
        assertEq(bet.endTime(), bet.startTime() + BET_DURATION);
    }

    function test_deposit_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit IBet.Deposited(alice, BET_AMOUNT);

        vm.prank(alice);
        bet.deposit();
    }

    function test_deposit_lockEmitsEvent() public {
        vm.prank(alice);
        bet.deposit();

        vm.expectEmit(false, false, false, true);
        emit IBet.BetLocked(INITIAL_PRICE, block.timestamp, block.timestamp + BET_DURATION);

        vm.prank(bob);
        bet.deposit();
    }

    function test_deposit_revertNotParticipant() public {
        vm.expectRevert(IBet.NotParticipant.selector);
        vm.prank(charlie);
        bet.deposit();
    }

    function test_deposit_revertAlreadyDeposited() public {
        vm.prank(alice);
        bet.deposit();

        vm.expectRevert(IBet.AlreadyDeposited.selector);
        vm.prank(alice);
        bet.deposit();
    }

    function test_deposit_revertAfterTimeout() public {
        vm.warp(block.timestamp + bet.DEPOSIT_TIMEOUT() + 1);

        vm.expectRevert(IBet.DepositTimeout.selector);
        vm.prank(alice);
        bet.deposit();
    }

    function test_deposit_revertWrongStatus() public {
        // Deposit both to lock
        vm.prank(alice);
        bet.deposit();
        vm.prank(bob);
        bet.deposit();

        // Try to deposit again (status is now Locked)
        vm.expectRevert(IBet.InvalidStatus.selector);
        vm.prank(alice);
        bet.deposit();
    }

    /*//////////////////////////////////////////////////////////////
                         SETTLEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function _depositBoth() internal {
        vm.prank(alice);
        bet.deposit();
        vm.prank(bob);
        bet.deposit();
    }

    function test_settle_participant1Wins() public {
        _depositBoth();

        // Price goes UP
        int256 newPrice = INITIAL_PRICE + 1000e8;
        vm.warp(bet.endTime());
        priceFeed.setPrice(newPrice);

        bet.settle();

        uint256 totalPot = BET_AMOUNT * 2;
        uint256 fee = (totalPot * FEE_BPS) / 10_000;
        uint256 payout = totalPot - fee;

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Settled));
        assertEq(bet.winner(), alice);
        assertEq(bet.endPrice(), newPrice);
        assertEq(token.balanceOf(alice), BET_AMOUNT * 10 - BET_AMOUNT + payout);
        assertEq(token.balanceOf(bob), BET_AMOUNT * 10 - BET_AMOUNT);
        assertEq(token.balanceOf(feeCollector), fee);
    }

    function test_settle_participant2Wins() public {
        _depositBoth();

        // Price goes DOWN
        int256 newPrice = INITIAL_PRICE - 1000e8;
        vm.warp(bet.endTime());
        priceFeed.setPrice(newPrice);

        bet.settle();

        uint256 totalPot = BET_AMOUNT * 2;
        uint256 fee = (totalPot * FEE_BPS) / 10_000;
        uint256 payout = totalPot - fee;

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Settled));
        assertEq(bet.winner(), bob);
        assertEq(bet.endPrice(), newPrice);
        assertEq(token.balanceOf(bob), BET_AMOUNT * 10 - BET_AMOUNT + payout);
        assertEq(token.balanceOf(alice), BET_AMOUNT * 10 - BET_AMOUNT);
        assertEq(token.balanceOf(feeCollector), fee);
    }

    function test_settle_equalPriceRefund() public {
        _depositBoth();

        // Price stays the same
        vm.warp(bet.endTime());
        priceFeed.setPrice(INITIAL_PRICE);

        bet.settle();

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Settled));
        assertEq(bet.winner(), address(0));
        assertEq(bet.endPrice(), INITIAL_PRICE);
        // Both get refunded — no fee on refund
        assertEq(token.balanceOf(alice), BET_AMOUNT * 10);
        assertEq(token.balanceOf(bob), BET_AMOUNT * 10);
        assertEq(token.balanceOf(feeCollector), 0);
    }

    function test_settle_noFeeWhenZeroBps() public {
        // Create bet with 0 fee
        Bet noFeeBet = new Bet(address(token), BET_AMOUNT, BET_DURATION, address(priceFeed), alice, bob, 0, address(0));
        vm.prank(alice);
        token.approve(address(noFeeBet), type(uint256).max);
        vm.prank(bob);
        token.approve(address(noFeeBet), type(uint256).max);

        vm.prank(alice);
        noFeeBet.deposit();
        vm.prank(bob);
        noFeeBet.deposit();

        vm.warp(noFeeBet.endTime());
        priceFeed.setPrice(INITIAL_PRICE + 100e8);
        noFeeBet.settle();

        assertEq(token.balanceOf(alice), BET_AMOUNT * 10 - BET_AMOUNT + BET_AMOUNT * 2);
    }

    function test_settle_emitsEvents() public {
        _depositBoth();

        int256 newPrice = INITIAL_PRICE + 500e8;
        vm.warp(bet.endTime());
        priceFeed.setPrice(newPrice);

        uint256 totalPot = BET_AMOUNT * 2;
        uint256 fee = (totalPot * FEE_BPS) / 10_000;

        vm.expectEmit(true, false, false, true);
        emit IBet.FeesCollected(feeCollector, fee);
        vm.expectEmit(true, false, false, true);
        emit IBet.BetSettled(alice, newPrice);

        bet.settle();
    }

    function test_settle_anyoneCanCall() public {
        _depositBoth();

        vm.warp(bet.endTime());
        priceFeed.setPrice(INITIAL_PRICE + 100e8);

        // Charlie (non-participant) can settle
        vm.prank(charlie);
        bet.settle();

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Settled));
    }

    function test_settle_revertBeforeExpiry() public {
        _depositBoth();

        priceFeed.setPrice(INITIAL_PRICE + 100e8);

        vm.expectRevert(IBet.BetNotExpired.selector);
        bet.settle();
    }

    function test_settle_revertWrongStatus() public {
        // Try to settle without deposits
        vm.expectRevert(IBet.InvalidStatus.selector);
        bet.settle();
    }

    function test_settle_revertStalePrice() public {
        // Warp forward so timestamp math doesn't underflow
        vm.warp(10_000);

        // Refresh mock price so it's not stale during lock
        priceFeed.setPrice(INITIAL_PRICE);

        Bet freshBet = new Bet(address(token), BET_AMOUNT, BET_DURATION, address(priceFeed), alice, bob, FEE_BPS, feeCollector);
        vm.prank(alice);
        token.approve(address(freshBet), type(uint256).max);
        vm.prank(bob);
        token.approve(address(freshBet), type(uint256).max);

        vm.prank(alice);
        freshBet.deposit();
        vm.prank(bob);
        freshBet.deposit();

        vm.warp(freshBet.endTime());
        // Set price with old timestamp (stale)
        priceFeed.setPriceWithTimestamp(INITIAL_PRICE + 100e8, block.timestamp - freshBet.MAX_ORACLE_STALENESS() - 1);

        vm.expectRevert(IBet.OracleStalePrice.selector);
        freshBet.settle();
    }

    function test_settle_revertInvalidPrice() public {
        _depositBoth();

        vm.warp(bet.endTime());
        priceFeed.setPrice(0);

        vm.expectRevert(IBet.OracleInvalidPrice.selector);
        bet.settle();
    }

    function test_settle_revertNegativePrice() public {
        _depositBoth();

        vm.warp(bet.endTime());
        priceFeed.setPrice(-1);

        vm.expectRevert(IBet.OracleInvalidPrice.selector);
        bet.settle();
    }

    function test_settle_cannotSettleTwice() public {
        _depositBoth();

        vm.warp(bet.endTime());
        priceFeed.setPrice(INITIAL_PRICE + 100e8);
        bet.settle();

        vm.expectRevert(IBet.InvalidStatus.selector);
        bet.settle();
    }

    /*//////////////////////////////////////////////////////////////
                        CANCELLATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_cancel_beforeAnyDeposit() public {
        vm.prank(alice);
        bet.cancel();

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Cancelled));
    }

    function test_cancel_afterOneDeposit_byDepositor() public {
        vm.prank(alice);
        bet.deposit();

        // Alice can cancel since Bob hasn't deposited
        vm.prank(alice);
        bet.cancel();

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Cancelled));
        assertEq(token.balanceOf(alice), BET_AMOUNT * 10); // refunded
    }

    function test_cancel_afterOneDeposit_byNonDepositor_reverts() public {
        vm.prank(alice);
        bet.deposit();

        // Bob cannot cancel before timeout because his opponent (Alice) already deposited
        vm.expectRevert(IBet.DepositTimeout.selector);
        vm.prank(bob);
        bet.cancel();
    }

    function test_cancel_revertIfBothDeposited_beforeTimeout() public {
        vm.prank(alice);
        bet.deposit();

        // Bob cannot cancel after Alice deposited — this reverts because opponent has deposited
        // Actually: Bob's opponent is Alice who has deposited, so Bob can't cancel before timeout
        vm.expectRevert(IBet.DepositTimeout.selector);
        vm.prank(bob);
        // Wait, the logic: Bob calls cancel. Bob's opponent = Alice. Alice has deposited. So revert.
        // But actually once alice deposits and bob deposits, status becomes Locked.
        // If only alice deposited, bob's opponent (alice) has deposited, so bob can't cancel.
        // Let me re-check: the cancel function checks if opponent has deposited.
        // Bob's opponent = participant1 = alice. hasDeposited[alice] = true. So revert.
        bet.cancel();
    }

    function test_cancel_afterTimeout_refundsDepositor() public {
        vm.prank(alice);
        bet.deposit();

        vm.warp(block.timestamp + bet.DEPOSIT_TIMEOUT() + 1);

        // Anyone can cancel after timeout
        vm.prank(charlie);
        bet.cancel();

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Cancelled));
        assertEq(token.balanceOf(alice), BET_AMOUNT * 10); // refunded
    }

    function test_cancel_afterTimeout_noDeposits() public {
        vm.warp(block.timestamp + bet.DEPOSIT_TIMEOUT() + 1);

        vm.prank(charlie);
        bet.cancel();

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Cancelled));
    }

    function test_cancel_emitsEvent() public {
        vm.expectEmit(false, false, false, false);
        emit IBet.BetCancelled();

        vm.prank(alice);
        bet.cancel();
    }

    function test_cancel_revertWhenLocked() public {
        _depositBoth();

        vm.expectRevert(IBet.InvalidStatus.selector);
        vm.prank(alice);
        bet.cancel();
    }

    function test_cancel_revertNonParticipantBeforeTimeout() public {
        vm.expectRevert(IBet.NotParticipant.selector);
        vm.prank(charlie);
        bet.cancel();
    }

    /*//////////////////////////////////////////////////////////////
                     EMERGENCY WITHDRAW TESTS
    //////////////////////////////////////////////////////////////*/

    function test_emergencyWithdraw() public {
        _depositBoth();

        // Warp past endTime + emergency timelock
        vm.warp(bet.endTime() + bet.EMERGENCY_TIMELOCK() + 1);

        vm.prank(alice);
        bet.emergencyWithdraw();

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Cancelled));
        assertEq(token.balanceOf(alice), BET_AMOUNT * 10);
        assertEq(token.balanceOf(bob), BET_AMOUNT * 10);
    }

    function test_emergencyWithdraw_emitsEvents() public {
        _depositBoth();

        vm.warp(bet.endTime() + bet.EMERGENCY_TIMELOCK() + 1);

        vm.expectEmit(true, false, false, true);
        emit IBet.EmergencyWithdraw(alice, BET_AMOUNT);
        vm.expectEmit(true, false, false, true);
        emit IBet.EmergencyWithdraw(bob, BET_AMOUNT);

        vm.prank(alice);
        bet.emergencyWithdraw();
    }

    function test_emergencyWithdraw_revertBeforeTimelock() public {
        _depositBoth();

        vm.warp(bet.endTime() + bet.EMERGENCY_TIMELOCK() - 1);

        vm.expectRevert(IBet.TimelockNotExpired.selector);
        vm.prank(alice);
        bet.emergencyWithdraw();
    }

    function test_emergencyWithdraw_revertNotParticipant() public {
        _depositBoth();

        vm.warp(bet.endTime() + bet.EMERGENCY_TIMELOCK() + 1);

        vm.expectRevert(IBet.NotParticipant.selector);
        vm.prank(charlie);
        bet.emergencyWithdraw();
    }

    function test_emergencyWithdraw_revertWrongStatus() public {
        // Not locked
        vm.expectRevert(IBet.InvalidStatus.selector);
        vm.prank(alice);
        bet.emergencyWithdraw();
    }

    /*//////////////////////////////////////////////////////////////
                         GET BET INFO TEST
    //////////////////////////////////////////////////////////////*/

    function test_getBetInfo() public {
        _depositBoth();

        IBet.BetInfo memory info = bet.getBetInfo();

        assertEq(info.participant1, alice);
        assertEq(info.participant2, bob);
        assertEq(info.token, address(token));
        assertEq(info.amount, BET_AMOUNT);
        assertEq(info.duration, BET_DURATION);
        assertEq(info.priceFeed, address(priceFeed));
        assertEq(info.startPrice, INITIAL_PRICE);
        assertEq(uint256(info.status), uint256(IBet.BetStatus.Locked));
        assertEq(info.feeBps, FEE_BPS);
        assertEq(info.feeRecipient, feeCollector);
    }

    /*//////////////////////////////////////////////////////////////
                     CHAINLINK AUTOMATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_checkUpkeep_settleNeeded() public {
        _depositBoth();
        vm.warp(bet.endTime());

        (bool needed, bytes memory data) = bet.checkUpkeep("");
        assertTrue(needed);
        assertEq(abi.decode(data, (uint8)), 0); // settle action
    }

    function test_checkUpkeep_cancelNeeded() public {
        vm.warp(block.timestamp + bet.DEPOSIT_TIMEOUT() + 1);

        (bool needed, bytes memory data) = bet.checkUpkeep("");
        assertTrue(needed);
        assertEq(abi.decode(data, (uint8)), 1); // cancel action
    }

    function test_checkUpkeep_noUpkeepNeeded() public {
        (bool needed,) = bet.checkUpkeep("");
        assertFalse(needed);
    }

    function test_performUpkeep_settle() public {
        _depositBoth();

        int256 newPrice = INITIAL_PRICE + 500e8;
        vm.warp(bet.endTime());
        priceFeed.setPrice(newPrice);

        bet.performUpkeep(abi.encode(uint8(0)));

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Settled));
        assertEq(bet.winner(), alice);
    }

    function test_performUpkeep_cancel() public {
        vm.prank(alice);
        bet.deposit();

        vm.warp(block.timestamp + bet.DEPOSIT_TIMEOUT() + 1);

        bet.performUpkeep(abi.encode(uint8(1)));

        assertEq(uint256(bet.status()), uint256(IBet.BetStatus.Cancelled));
        assertEq(token.balanceOf(alice), BET_AMOUNT * 10); // refunded
    }

    /*//////////////////////////////////////////////////////////////
                     ORACLE STALENESS ON LOCK TEST
    //////////////////////////////////////////////////////////////*/

    function test_deposit_revertStalePriceOnLock() public {
        // Warp forward so the stale timestamp math doesn't underflow
        vm.warp(10_000);

        // Create a fresh bet so createdAt matches warped time
        Bet freshBet = new Bet(address(token), BET_AMOUNT, BET_DURATION, address(priceFeed), alice, bob, FEE_BPS, feeCollector);
        vm.prank(alice);
        token.approve(address(freshBet), type(uint256).max);
        vm.prank(bob);
        token.approve(address(freshBet), type(uint256).max);

        vm.prank(alice);
        freshBet.deposit();

        // Make oracle stale
        priceFeed.setPriceWithTimestamp(INITIAL_PRICE, block.timestamp - freshBet.MAX_ORACLE_STALENESS() - 1);

        vm.expectRevert(IBet.OracleStalePrice.selector);
        vm.prank(bob);
        freshBet.deposit();
    }

    function test_deposit_revertInvalidPriceOnLock() public {
        vm.prank(alice);
        bet.deposit();

        priceFeed.setPrice(0);

        vm.expectRevert(IBet.OracleInvalidPrice.selector);
        vm.prank(bob);
        bet.deposit();
    }

    /*//////////////////////////////////////////////////////////////
                           FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_settle_priceUp(int256 priceIncrease) public {
        vm.assume(priceIncrease > 0 && priceIncrease < type(int256).max - INITIAL_PRICE);

        _depositBoth();

        int256 newPrice = INITIAL_PRICE + priceIncrease;
        vm.warp(bet.endTime());
        priceFeed.setPrice(newPrice);

        bet.settle();

        assertEq(bet.winner(), alice);
    }

    function testFuzz_settle_priceDown(int256 priceDecrease) public {
        vm.assume(priceDecrease > 0 && priceDecrease < INITIAL_PRICE);

        _depositBoth();

        int256 newPrice = INITIAL_PRICE - priceDecrease;
        vm.assume(newPrice > 0); // Must be positive
        vm.warp(bet.endTime());
        priceFeed.setPrice(newPrice);

        bet.settle();

        assertEq(bet.winner(), bob);
    }
}
