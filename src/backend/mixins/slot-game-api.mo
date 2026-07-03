import Array "mo:core/Array";
import Error "mo:core/Error";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat64 "mo:core/Nat64";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import SlotGame "../types/slot-game";
import Accounts "../lib/accounts";
import SlotGameLib "../lib/slot-game";

mixin (
  selfActor : actor {},
  accessControlState : AccessControl.AccessControlState,
  players : Map.Map<Common.UserId, SlotGame.Player>,
  spinHistory : Map.Map<Common.UserId, List.List<SlotGame.SpinRecord>>,
  transactions : Map.Map<Common.UserId, List.List<SlotGame.Transaction>>,
  houseBalance : {
    var balance : Common.Tokens;
    var creditedHouseLedger : Common.Tokens;
    var creditedDefaultLedger : Common.Tokens;
  },
  aggregateStats : {
    var totalSpins : Nat;
    var totalWagered : Common.Tokens;
    var totalPaidOut : Common.Tokens;
    var houseRetained : Common.Tokens;
  },
  counters : { var nextSpinId : Nat; var nextTxId : Nat },
) {
  type IcrcAccount = { owner : Principal; subaccount : ?Blob };

  type IcrcTransferArg = {
    from_subaccount : ?Blob;
    to : IcrcAccount;
    amount : Nat;
    fee : ?Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };

  type IcrcTransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  type LegacyTokens = { e8s : Nat64 };
  type LegacyTimestamp = { timestamp_nanos : Nat64 };
  type LegacyTransferArg = {
    memo : Nat64;
    amount : LegacyTokens;
    fee : LegacyTokens;
    from_subaccount : ?Blob;
    to : Blob;
    created_at_time : ?LegacyTimestamp;
  };
  type LegacyTransferError = {
    #BadFee : { expected_fee : LegacyTokens };
    #InsufficientFunds : { balance : LegacyTokens };
    #TxTooOld : { allowed_window_nanos : Nat64 };
    #TxCreatedInFuture;
    #TxDuplicate : { duplicate_of : Nat64 };
  };

  type LedgerTransfer = {
    blockIndex : Nat;
    fee : Common.Tokens;
  };
  type TransferAttempt = {
    #ok : LedgerTransfer;
    #badFee : Common.Tokens;
    #err : Text;
  };
  type CallResult<Ok, Err> = { #ok : Ok; #err : Err };

  transient let icpLedger = actor ("ryjl3-tyaaa-aaaaa-aaaba-cai") : actor {
    icrc1_balance_of : shared query (IcrcAccount) -> async Nat;
    icrc1_fee : shared query () -> async Nat;
    icrc1_transfer : shared (IcrcTransferArg) -> async {
      #Ok : Nat;
      #Err : IcrcTransferError;
    };
    transfer : shared (LegacyTransferArg) -> async {
      #Ok : Nat64;
      #Err : LegacyTransferError;
    };
  };

  // ICP currently charges 10_000 e8s. Cache it to avoid an extra ledger query
  // on every spin; BadFee responses update the cache and are retried once.
  transient var cachedLedgerFee : Common.Tokens = 10_000;
  transient let pendingLedgerOperations = Map.empty<Principal, Bool>();
  transient var houseLedgerBusy = false;

  // ---- Ledger helpers ----

  func canisterPrincipal() : Principal {
    Principal.fromActor(selfActor);
  };

  func nowTimestamp() : Common.Timestamp {
    Int.abs(Time.now());
  };

  func nowNat64() : Nat64 {
    Nat64.fromNat(nowTimestamp());
  };

  func subtractOrZero(value : Nat, amount : Nat) : Nat {
    if (value >= amount) value - amount else 0;
  };

  func queryLedgerBalance(account : IcrcAccount) : async CallResult<Nat, Text> {
    try {
      #ok(await icpLedger.icrc1_balance_of(account));
    } catch (error) {
      #err("ICP ledger balance call failed: " # error.message());
    };
  };

  func refreshLedgerFee() : async Common.Tokens {
    try {
      let fee = await icpLedger.icrc1_fee();
      if (fee > 0) cachedLedgerFee := fee;
      cachedLedgerFee;
    } catch (_) {
      cachedLedgerFee;
    };
  };

  func icrcErrorText(error : IcrcTransferError) : Text {
    switch (error) {
      case (#BadFee({ expected_fee })) {
        "ICP ledger fee changed to " # expected_fee.toText() # " e8s";
      };
      case (#BadBurn({ min_burn_amount })) {
        "Transfer is below the minimum burn amount of " # min_burn_amount.toText() # " e8s";
      };
      case (#InsufficientFunds({ balance })) {
        "Ledger account has insufficient funds (" # balance.toText() # " e8s available)";
      };
      case (#TooOld) "Transfer request is too old";
      case (#CreatedInFuture(_)) "Transfer timestamp is in the future";
      case (#Duplicate({ duplicate_of })) {
        "Duplicate transfer at block " # duplicate_of.toText();
      };
      case (#TemporarilyUnavailable) "ICP ledger is temporarily unavailable";
      case (#GenericError({ message; error_code })) {
        "ICP ledger error " # error_code.toText() # ": " # message;
      };
    };
  };

  func callIcrcTransfer(
    fromSubaccount : ?Blob,
    to : IcrcAccount,
    amount : Nat,
    fee : Nat,
    createdAt : Nat64,
  ) : async TransferAttempt {
    try {
      let result = await icpLedger.icrc1_transfer({
        from_subaccount = fromSubaccount;
        to;
        amount;
        fee = ?fee;
        memo = null;
        created_at_time = ?createdAt;
      });
      switch (result) {
        case (#Ok(blockIndex)) #ok({ blockIndex; fee });
        case (#Err(#Duplicate({ duplicate_of }))) {
          #ok({ blockIndex = duplicate_of; fee });
        };
        case (#Err(#BadFee({ expected_fee }))) #badFee(expected_fee);
        case (#Err(error)) #err(icrcErrorText(error));
      };
    } catch (error) {
      #err("ICP ledger transfer call failed: " # error.message());
    };
  };

  func transferIcrc(
    fromSubaccount : ?Blob,
    to : IcrcAccount,
    amount : Nat,
    createdAt : Nat64,
  ) : async CallResult<LedgerTransfer, Text> {
    let firstFee = cachedLedgerFee;
    switch (await callIcrcTransfer(fromSubaccount, to, amount, firstFee, createdAt)) {
      case (#ok(result)) #ok(result);
      case (#err(message)) #err(message);
      case (#badFee(expectedFee)) {
        cachedLedgerFee := expectedFee;
        switch (await callIcrcTransfer(fromSubaccount, to, amount, expectedFee, createdAt)) {
          case (#ok(result)) #ok(result);
          case (#badFee(newFee)) {
            cachedLedgerFee := newFee;
            #err("ICP ledger fee changed again; retry the operation");
          };
          case (#err(message)) #err(message);
        };
      };
    };
  };

  func legacyErrorText(error : LegacyTransferError) : Text {
    switch (error) {
      case (#BadFee({ expected_fee })) {
        "ICP ledger fee changed to " # expected_fee.e8s.toText() # " e8s";
      };
      case (#InsufficientFunds({ balance })) {
        "Ledger account has insufficient funds (" # balance.e8s.toText() # " e8s available)";
      };
      case (#TxTooOld(_)) "Transfer request is too old";
      case (#TxCreatedInFuture) "Transfer timestamp is in the future";
      case (#TxDuplicate({ duplicate_of })) {
        "Duplicate transfer at block " # duplicate_of.toText();
      };
    };
  };

  func callLegacyTransfer(
    fromSubaccount : ?Blob,
    to : Blob,
    amount : Nat,
    fee : Nat,
    createdAt : Nat64,
  ) : async TransferAttempt {
    try {
      let result = await icpLedger.transfer({
        memo = createdAt;
        amount = { e8s = Nat64.fromNat(amount) };
        fee = { e8s = Nat64.fromNat(fee) };
        from_subaccount = fromSubaccount;
        to;
        created_at_time = ?{ timestamp_nanos = createdAt };
      });
      switch (result) {
        case (#Ok(blockIndex)) #ok({ blockIndex = blockIndex.toNat(); fee });
        case (#Err(#TxDuplicate({ duplicate_of }))) {
          #ok({ blockIndex = duplicate_of.toNat(); fee });
        };
        case (#Err(#BadFee({ expected_fee }))) #badFee(expected_fee.e8s.toNat());
        case (#Err(error)) #err(legacyErrorText(error));
      };
    } catch (error) {
      #err("ICP ledger transfer call failed: " # error.message());
    };
  };

  func transferLegacy(
    fromSubaccount : ?Blob,
    to : Blob,
    amount : Nat,
    createdAt : Nat64,
  ) : async CallResult<LedgerTransfer, Text> {
    let firstFee = cachedLedgerFee;
    switch (await callLegacyTransfer(fromSubaccount, to, amount, firstFee, createdAt)) {
      case (#ok(result)) #ok(result);
      case (#err(message)) #err(message);
      case (#badFee(expectedFee)) {
        cachedLedgerFee := expectedFee;
        switch (await callLegacyTransfer(fromSubaccount, to, amount, expectedFee, createdAt)) {
          case (#ok(result)) #ok(result);
          case (#badFee(newFee)) {
            cachedLedgerFee := newFee;
            #err("ICP ledger fee changed again; retry the operation");
          };
          case (#err(message)) #err(message);
        };
      };
    };
  };

  // ---- Concurrency guards ----

  func acquirePlayerGuard(caller : Principal) : CallResult<(), Text> {
    if (pendingLedgerOperations.get(caller) != null) {
      return #err("Another ledger operation is already running for this account");
    };
    pendingLedgerOperations.add(caller, true);
    #ok;
  };

  func releasePlayerGuard(caller : Principal) {
    pendingLedgerOperations.remove(caller);
  };

  func acquireHouseGuard() : CallResult<(), Text> {
    if (houseLedgerBusy) return #err("The house ledger is busy; try again in a moment");
    houseLedgerBusy := true;
    #ok;
  };

  func releaseHouseGuard() {
    houseLedgerBusy := false;
  };

  // ---- State helpers ----

  func requirePlayer(caller : Common.UserId) : SlotGame.Player {
    switch (players.get(caller)) {
      case (?player) player;
      case null Runtime.trap("Not a registered player — call getOrCreatePlayer first");
    };
  };

  func subAccountFor(id : Common.UserId) : Common.SubAccount {
    let raw = id.toBlob();
    let bytes = Array.tabulate(32, func(index) {
      raw[index % raw.size()];
    });
    Blob.fromArray(bytes);
  };

  func appendSpinRecord(userId : Common.UserId, record : SlotGame.SpinRecord) {
    let list = switch (spinHistory.get(userId)) {
      case (?existing) existing;
      case null {
        let created = List.empty<SlotGame.SpinRecord>();
        spinHistory.add(userId, created);
        created;
      };
    };
    list.add(record);
    if (list.size() > SlotGameLib.SPIN_HISTORY_LIMIT) {
      let kept = list.sliceToArray(1, list.size());
      list.clear();
      for (item in kept.values()) list.add(item);
    };
  };

  func appendTransaction(userId : Common.UserId, tx : SlotGame.Transaction) {
    let list = switch (transactions.get(userId)) {
      case (?existing) existing;
      case null {
        let created = List.empty<SlotGame.Transaction>();
        transactions.add(userId, created);
        created;
      };
    };
    list.add(tx);
    if (list.size() > SlotGameLib.TX_HISTORY_LIMIT) {
      let kept = list.sliceToArray(1, list.size());
      list.clear();
      for (item in kept.values()) list.add(item);
    };
  };

  func nextSpinId() : Nat {
    let id = counters.nextSpinId;
    counters.nextSpinId += 1;
    id;
  };

  func nextTxId() : Nat {
    let id = counters.nextTxId;
    counters.nextTxId += 1;
    id;
  };

  func adjustReservedBalance(
    current : Nat,
    reservedFee : Nat,
    actualFee : Nat,
  ) : Nat {
    if (actualFee > reservedFee) {
      subtractOrZero(current, actualFee - reservedFee);
    } else {
      current + (reservedFee - actualFee);
    };
  };

  func updateHouseRetained() {
    aggregateStats.houseRetained := if (aggregateStats.totalWagered >= aggregateStats.totalPaidOut) {
      aggregateStats.totalWagered - aggregateStats.totalPaidOut;
    } else {
      0;
    };
  };

  // ---- Player account provisioning ----

  public shared ({ caller }) func getOrCreatePlayer() : async SlotGame.PlayerView {
    if (caller.isAnonymous()) Runtime.trap("Anonymous callers cannot register");
    switch (players.get(caller)) {
      case (?player) SlotGameLib.toPlayerView(player);
      case null {
        let isFirst = players.size() == 0;
        let player : SlotGame.Player = {
          id = caller;
          subAccount = subAccountFor(caller);
          var balance = 0;
          var creditedLedgerBalance = 0;
        };
        players.add(caller, player);
        if (isFirst) {
          AccessControl.assignRole(accessControlState, caller, caller, #admin);
        };
        SlotGameLib.toPlayerView(player);
      };
    };
  };

  public query ({ caller }) func getBalance() : async Common.Tokens {
    switch (players.get(caller)) {
      case (?player) player.balance;
      case null 0;
    };
  };

  public query ({ caller }) func getDepositAccount() : async SlotGame.DepositAccountView {
    let player = requirePlayer(caller);
    {
      accountId = Accounts.accountIdentifier(canisterPrincipal(), player.subAccount);
      legacyAccountId = null;
      canisterId = canisterPrincipal();
    };
  };

  public shared ({ caller }) func syncDeposit() : async SlotGame.SyncDepositResult {
    let player = requirePlayer(caller);
    switch (acquirePlayerGuard(caller)) {
      case (#err(message)) {
        return {
          credited = 0;
          balance = player.balance;
          ledgerHouse = 0;
          ledgerDefault = 0;
          warning = ?message;
        };
      };
      case (#ok) {};
    };
    try {
      switch (await queryLedgerBalance({
        owner = canisterPrincipal();
        subaccount = ?player.subAccount;
      })) {
        case (#err(message)) {
          {
            credited = 0;
            balance = player.balance;
            ledgerHouse = 0;
            ledgerDefault = 0;
            warning = ?message;
          };
        };
        case (#ok(ledgerBalance)) {
          let credited = if (ledgerBalance > player.creditedLedgerBalance) {
            subtractOrZero(ledgerBalance, player.creditedLedgerBalance);
          } else {
            0;
          };
          player.balance := ledgerBalance;
          player.creditedLedgerBalance := ledgerBalance;
          if (credited > 0) {
            appendTransaction(caller, {
              id = nextTxId();
              timestamp = nowTimestamp();
              kind = #transferIn;
              amount = credited;
              counterparty = null;
            });
          };
          {
            credited;
            balance = ledgerBalance;
            ledgerHouse = 0;
            ledgerDefault = 0;
            warning = null;
          };
        };
      };
    } finally {
      releasePlayerGuard(caller);
    };
  };

  // ---- Slot gameplay ----

  func refundWager(
    player : SlotGame.Player,
    wager : Nat,
    wagerFee : Nat,
  ) : async Text {
    let refundAmount = wager + wagerFee;
    let reservedFee = cachedLedgerFee;
    let reservedTotal = refundAmount + reservedFee;
    if (houseBalance.balance < reservedTotal) {
      return "The wager reached the house, but the automatic refund could not be funded; contact the administrator";
    };
    houseBalance.balance -= reservedTotal;
    switch (await transferIcrc(
      ?Accounts.houseSubAccount,
      { owner = canisterPrincipal(); subaccount = ?player.subAccount },
      refundAmount,
      nowNat64(),
    )) {
      case (#err(message)) {
        houseBalance.balance += reservedTotal;
        "The wager reached the house and the automatic refund failed: " # message;
      };
      case (#ok(refund)) {
        houseBalance.balance := adjustReservedBalance(houseBalance.balance, reservedFee, refund.fee);
        let ledgerDebit = refundAmount + refund.fee;
        houseBalance.creditedHouseLedger := subtractOrZero(houseBalance.creditedHouseLedger, ledgerDebit);
        player.balance += refundAmount;
        player.creditedLedgerBalance += refundAmount;
        "Spin cancelled and the wager was refunded (ledger fees are non-refundable)";
      };
    };
  };

  func executeSpin(
    caller : Principal,
    player : SlotGame.Player,
    activeLines : Nat,
  ) : async SlotGame.SpinResult {
    let wager = SlotGameLib.computeWager(activeLines);
    let reservedFee = cachedLedgerFee;
    let playerDebit = wager + reservedFee;
    if (player.balance < playerDebit) {
      return #err(
        "Insufficient balance: a spin requires the wager plus the " #
        reservedFee.toText() # " e8s ICP ledger fee"
      );
    };

    let seed = nowTimestamp() + Nat.fromNat32(caller.hash()) + counters.nextSpinId;
    let outcome = SlotGameLib.evaluateSpin(SlotGameLib.generateSpin(seed), activeLines);
    var payoutReserved = if (outcome.won) outcome.payout + reservedFee else 0;
    if (houseBalance.balance < payoutReserved) {
      return #err("House vault is temporarily underfunded for this payout; ask the administrator to fund and sync it");
    };

    player.balance -= playerDebit;
    player.creditedLedgerBalance := subtractOrZero(player.creditedLedgerBalance, playerDebit);
    houseBalance.balance -= payoutReserved;

    let wagerTransfer = await transferIcrc(
      ?player.subAccount,
      { owner = canisterPrincipal(); subaccount = ?Accounts.houseSubAccount },
      wager,
      nowNat64(),
    );
    let wagerReceipt = switch (wagerTransfer) {
      case (#err(message)) {
        player.balance += playerDebit;
        player.creditedLedgerBalance += playerDebit;
        houseBalance.balance += payoutReserved;
        return #err("Wager transfer failed: " # message);
      };
      case (#ok(receipt)) receipt;
    };

    player.balance := adjustReservedBalance(player.balance, reservedFee, wagerReceipt.fee);
    player.creditedLedgerBalance := adjustReservedBalance(
      player.creditedLedgerBalance,
      reservedFee,
      wagerReceipt.fee,
    );
    houseBalance.balance += wager;
    houseBalance.creditedHouseLedger += wager;

    if (outcome.won) {
      let desiredReserve = outcome.payout + cachedLedgerFee;
      if (desiredReserve > payoutReserved) {
        let extra = subtractOrZero(desiredReserve, payoutReserved);
        if (houseBalance.balance < extra) {
          houseBalance.balance += payoutReserved;
          let refundMessage = await refundWager(player, wager, wagerReceipt.fee);
          return #err(refundMessage);
        };
        houseBalance.balance -= extra;
      } else {
        houseBalance.balance += payoutReserved - desiredReserve;
      };
      payoutReserved := desiredReserve;

      switch (await transferIcrc(
        ?Accounts.houseSubAccount,
        { owner = canisterPrincipal(); subaccount = ?player.subAccount },
        outcome.payout,
        nowNat64(),
      )) {
        case (#err(message)) {
          houseBalance.balance += payoutReserved;
          let refundMessage = await refundWager(player, wager, wagerReceipt.fee);
          return #err("Payout transfer failed (" # message # "). " # refundMessage);
        };
        case (#ok(payoutReceipt)) {
          houseBalance.balance := adjustReservedBalance(
            houseBalance.balance,
            payoutReserved - outcome.payout,
            payoutReceipt.fee,
          );
          houseBalance.creditedHouseLedger := subtractOrZero(
            houseBalance.creditedHouseLedger,
            outcome.payout + payoutReceipt.fee,
          );
          player.balance += outcome.payout;
          player.creditedLedgerBalance += outcome.payout;
          appendTransaction(caller, {
            id = nextTxId();
            timestamp = nowTimestamp();
            kind = #win;
            amount = outcome.payout;
            counterparty = ?Accounts.houseAccountIdentifier(canisterPrincipal());
          });
        };
      };
    };

    appendTransaction(caller, {
      id = nextTxId();
      timestamp = nowTimestamp();
      kind = #spinCost;
      amount = wager;
      counterparty = ?Accounts.houseAccountIdentifier(canisterPrincipal());
    });
    appendSpinRecord(caller, {
      id = nextSpinId();
      timestamp = nowTimestamp();
      reels = outcome.reels;
      activeLines = outcome.activeLines;
      wager = outcome.wager;
      payout = outcome.payout;
      won = outcome.won;
      winningLines = outcome.winningLines;
    });
    aggregateStats.totalSpins += 1;
    aggregateStats.totalWagered += wager;
    aggregateStats.totalPaidOut += outcome.payout;
    updateHouseRetained();
    #ok(outcome);
  };

  public shared ({ caller }) func spin(activeLines : Nat) : async SlotGame.SpinResult {
    if (not SlotGameLib.isValidLineCount(activeLines)) {
      return #err("activeLines must be 1, 3, 5, or 9");
    };
    let player = requirePlayer(caller);
    switch (acquirePlayerGuard(caller)) {
      case (#err(message)) return #err(message);
      case (#ok) {};
    };
    switch (acquireHouseGuard()) {
      case (#err(message)) {
        releasePlayerGuard(caller);
        return #err(message);
      };
      case (#ok) {};
    };
    try {
      await executeSpin(caller, player, activeLines);
    } finally {
      releaseHouseGuard();
      releasePlayerGuard(caller);
    };
  };

  public query ({ caller }) func getSpinHistory() : async [SlotGame.SpinRecord] {
    switch (spinHistory.get(caller)) {
      case (?records) SlotGameLib.toSpinHistory(records);
      case null [];
    };
  };

  // ---- Wallet / transfers ----

  public query ({ caller }) func getTransactionHistory() : async [SlotGame.Transaction] {
    switch (transactions.get(caller)) {
      case (?records) SlotGameLib.toTransactionHistory(records);
      case null [];
    };
  };

  func executePlayerTransfer(
    caller : Principal,
    player : SlotGame.Player,
    to : Common.AccountIdentifier,
    amount : Common.Tokens,
  ) : async SlotGame.TransferResult {
    if (amount == 0) return #err("Transfer amount must be greater than zero");
    let reservedFee = cachedLedgerFee;
    let reservedTotal = amount + reservedFee;
    if (player.balance < reservedTotal) {
      return #err("Insufficient balance for the amount plus the ICP ledger fee");
    };
    player.balance -= reservedTotal;
    player.creditedLedgerBalance := subtractOrZero(player.creditedLedgerBalance, reservedTotal);
    switch (await transferLegacy(?player.subAccount, to, amount, nowNat64())) {
      case (#err(message)) {
        player.balance += reservedTotal;
        player.creditedLedgerBalance += reservedTotal;
        #err(message);
      };
      case (#ok(receipt)) {
        player.balance := adjustReservedBalance(player.balance, reservedFee, receipt.fee);
        player.creditedLedgerBalance := adjustReservedBalance(
          player.creditedLedgerBalance,
          reservedFee,
          receipt.fee,
        );
        appendTransaction(caller, {
          id = nextTxId();
          timestamp = nowTimestamp();
          kind = #transferOut;
          amount;
          counterparty = ?to;
        });
        #ok({ amount; fee = receipt.fee; blockIndex = receipt.blockIndex });
      };
    };
  };

  public shared ({ caller }) func transfer(
    to : Common.AccountIdentifier,
    amount : Common.Tokens,
  ) : async SlotGame.TransferResult {
    let player = requirePlayer(caller);
    switch (acquirePlayerGuard(caller)) {
      case (#err(message)) return #err(message);
      case (#ok) {};
    };
    try {
      await executePlayerTransfer(caller, player, to, amount);
    } finally {
      releasePlayerGuard(caller);
    };
  };

  // ---- Admin ----

  public query ({ caller }) func getHouseDepositAccount() : async SlotGame.DepositAccountView {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    let owner = canisterPrincipal();
    {
      accountId = Accounts.houseAccountIdentifier(owner);
      legacyAccountId = null;
      canisterId = owner;
    };
  };

  func executeHouseSync() : async SlotGame.SyncDepositResult {
    let owner = canisterPrincipal();
    let houseResult = await queryLedgerBalance({
      owner;
      subaccount = ?Accounts.houseSubAccount;
    });
    let defaultResult = await queryLedgerBalance({ owner; subaccount = null });
    let onHouse = switch (houseResult) {
      case (#ok(balance)) balance;
      case (#err(message)) {
        return {
          credited = 0;
          balance = houseBalance.balance;
          ledgerHouse = houseBalance.creditedHouseLedger;
          ledgerDefault = houseBalance.creditedDefaultLedger;
          warning = ?message;
        };
      };
    };
    var onDefault = switch (defaultResult) {
      case (#ok(balance)) balance;
      case (#err(message)) {
        return {
          credited = 0;
          balance = houseBalance.balance;
          ledgerHouse = onHouse;
          ledgerDefault = houseBalance.creditedDefaultLedger;
          warning = ?message;
        };
      };
    };

    let previousHouse = houseBalance.balance;
    var finalHouse = onHouse;
    var warning : ?Text = null;
    if (onDefault > 0) {
      let fee = await refreshLedgerFee();
      if (onDefault > fee) {
        let sweepAmount = subtractOrZero(onDefault, fee);
        switch (await transferIcrc(
          null,
          { owner; subaccount = ?Accounts.houseSubAccount },
          sweepAmount,
          nowNat64(),
        )) {
          case (#ok(_)) {
            finalHouse += sweepAmount;
            onDefault := 0;
          };
          case (#err(message)) {
            warning := ?("Legacy default-account funds could not be swept into the house vault: " # message);
          };
        };
      } else {
        warning := ?("The legacy default account contains only fee-sized dust and cannot be swept");
      };
    };

    houseBalance.balance := finalHouse;
    houseBalance.creditedHouseLedger := finalHouse;
    houseBalance.creditedDefaultLedger := onDefault;
    {
      credited = if (finalHouse > previousHouse) finalHouse - previousHouse else 0;
      balance = finalHouse;
      ledgerHouse = finalHouse;
      ledgerDefault = onDefault;
      warning;
    };
  };

  public shared ({ caller }) func syncHouseDeposit() : async SlotGame.SyncDepositResult {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    switch (acquireHouseGuard()) {
      case (#err(message)) {
        return {
          credited = 0;
          balance = houseBalance.balance;
          ledgerHouse = houseBalance.creditedHouseLedger;
          ledgerDefault = houseBalance.creditedDefaultLedger;
          warning = ?message;
        };
      };
      case (#ok) {};
    };
    try {
      await executeHouseSync();
    } finally {
      releaseHouseGuard();
    };
  };

  public query ({ caller }) func getHouseBalance() : async Common.Tokens {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    houseBalance.balance;
  };

  public query ({ caller }) func getHouseStats() : async SlotGame.HouseStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    {
      totalSpins = aggregateStats.totalSpins;
      totalWagered = aggregateStats.totalWagered;
      totalPaidOut = aggregateStats.totalPaidOut;
      houseRetained = aggregateStats.houseRetained;
      houseBalance = houseBalance.balance;
    };
  };

  func executeAdminTransfer(
    caller : Principal,
    to : Common.AccountIdentifier,
    amount : Common.Tokens,
  ) : async SlotGame.TransferResult {
    if (amount == 0) return #err("Transfer amount must be greater than zero");
    let reservedFee = cachedLedgerFee;
    let reservedTotal = amount + reservedFee;
    if (houseBalance.balance < reservedTotal) {
      return #err("Insufficient house balance for the amount plus the ICP ledger fee");
    };
    houseBalance.balance -= reservedTotal;
    switch (await transferLegacy(?Accounts.houseSubAccount, to, amount, nowNat64())) {
      case (#err(message)) {
        houseBalance.balance += reservedTotal;
        #err(message);
      };
      case (#ok(receipt)) {
        houseBalance.balance := adjustReservedBalance(houseBalance.balance, reservedFee, receipt.fee);
        houseBalance.creditedHouseLedger := subtractOrZero(
          houseBalance.creditedHouseLedger,
          amount + receipt.fee,
        );
        appendTransaction(caller, {
          id = nextTxId();
          timestamp = nowTimestamp();
          kind = #adminTransferOut;
          amount;
          counterparty = ?to;
        });
        #ok({ amount; fee = receipt.fee; blockIndex = receipt.blockIndex });
      };
    };
  };

  public shared ({ caller }) func adminTransfer(
    to : Common.AccountIdentifier,
    amount : Common.Tokens,
  ) : async SlotGame.TransferResult {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    switch (acquireHouseGuard()) {
      case (#err(message)) return #err(message);
      case (#ok) {};
    };
    try {
      await executeAdminTransfer(caller, to, amount);
    } finally {
      releaseHouseGuard();
    };
  };
};
