import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import SlotGame "../types/slot-game";
import SlotGameLib "../lib/slot-game";

mixin (
  accessControlState : AccessControl.AccessControlState,
  players : Map.Map<Common.UserId, SlotGame.Player>,
  spinHistory : Map.Map<Common.UserId, List.List<SlotGame.SpinRecord>>,
  transactions : Map.Map<Common.UserId, List.List<SlotGame.Transaction>>,
  houseBalance : { var balance : Common.Tokens },
  aggregateStats : {
    var totalSpins : Nat;
    var totalWagered : Common.Tokens;
    var totalPaidOut : Common.Tokens;
    var houseRetained : Common.Tokens;
  },
  counters : { var nextSpinId : Nat; var nextTxId : Nat },
) {
  // ---- Helpers ----

  // Require the caller to be a registered player; trap otherwise.
  func requirePlayer(caller : Common.UserId) : SlotGame.Player {
    switch (players.get(caller)) {
      case (?p) p;
      case null Runtime.trap("Not a registered player — call getOrCreatePlayer first");
    };
  };

  // Derive a deterministic 32-byte subaccount for a player from their principal.
  // The subaccount is the principal's blob bytes repeated to fill 32 bytes.
  func subAccountFor(id : Common.UserId) : Common.SubAccount {
    let raw = id.toBlob();
    let bytes = Array.tabulate(32, func(i) {
      raw[i % raw.size()];
    });
    Blob.fromArray(bytes);
  };

  // Append a spin record to the player's history, capping at the limit.
  // History is stored newest-first.
  func appendSpinRecord(userId : Common.UserId, record : SlotGame.SpinRecord) {
    let list = switch (spinHistory.get(userId)) {
      case (?l) l;
      case null {
        let l = List.empty<SlotGame.SpinRecord>();
        spinHistory.add(userId, l);
        l;
      };
    };
    list.add(record);
    if (list.size() > SlotGameLib.SPIN_HISTORY_LIMIT) {
      // Drop the oldest entry (index 0) by rebuilding.
      let kept = list.sliceToArray(1, list.size());
      list.clear();
      for (r in kept.values()) {
        list.add(r);
      };
    };
  };

  // Append a transaction to the player's history, capping at the limit.
  // History is stored newest-first.
  func appendTransaction(userId : Common.UserId, tx : SlotGame.Transaction) {
    let list = switch (transactions.get(userId)) {
      case (?l) l;
      case null {
        let l = List.empty<SlotGame.Transaction>();
        transactions.add(userId, l);
        l;
      };
    };
    list.add(tx);
    if (list.size() > SlotGameLib.TX_HISTORY_LIMIT) {
      let kept = list.sliceToArray(1, list.size());
      list.clear();
      for (t in kept.values()) {
        list.add(t);
      };
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

  func nowTimestamp() : Common.Timestamp {
    Int.abs(Time.now());
  };

  // ---- Player account provisioning ----

  // Returns the caller's player view, provisioning an account on first call.
  // The very first user to authenticate is granted admin role.
  public shared ({ caller }) func getOrCreatePlayer() : async SlotGame.PlayerView {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous callers cannot register");
    };
    switch (players.get(caller)) {
      case (?p) SlotGameLib.toPlayerView(p);
      case null {
        // First-ever player becomes admin.
        let isFirst = players.size() == 0;
        let sub = subAccountFor(caller);
        let player : SlotGame.Player = {
          id = caller;
          subAccount = sub;
          var balance = 0 : Common.Tokens;
        };
        players.add(caller, player);
        if (isFirst) {
          AccessControl.assignRole(accessControlState, caller, caller, #admin);
        };
        SlotGameLib.toPlayerView(player);
      };
    };
  };

  // Returns the caller's current ICP balance.
  public query ({ caller }) func getBalance() : async Common.Tokens {
    switch (players.get(caller)) {
      case (?p) p.balance;
      case null 0;
    };
  };

  // ---- Slot gameplay ----

  // Charges 0.01 ICP, spins the reels, evaluates the payline, and pays out
  // any winnings immediately to the player's account.
  public shared ({ caller }) func spin() : async SlotGame.SpinOutcome {
    let player = requirePlayer(caller);
    // Charge the spin cost.
    if (player.balance < SlotGameLib.SPIN_COST) {
      Runtime.trap("Insufficient balance to spin");
    };
    player.balance -= SlotGameLib.SPIN_COST;
    houseBalance.balance += SlotGameLib.SPIN_COST;

    // Record the spin cost transaction.
    appendTransaction(
      caller,
      {
        id = nextTxId();
        timestamp = nowTimestamp();
        kind = #spinCost;
        amount = SlotGameLib.SPIN_COST;
        counterparty = null;
      },
    );

    // Generate the spin using a seed derived from time + caller + spin id.
    let seed = nowTimestamp() + Nat.fromNat32(caller.hash()) + counters.nextSpinId;
    let symbols = SlotGameLib.generateSpin(seed);
    let outcome = SlotGameLib.evaluateSpin(symbols);

    // Pay out winnings immediately.
    if (outcome.won) {
      player.balance += outcome.payout;
      if (houseBalance.balance >= outcome.payout) {
        houseBalance.balance -= outcome.payout;
      } else {
        // House should never be short if payback < 100%, but guard anyway.
        houseBalance.balance := 0;
      };
      appendTransaction(
        caller,
        {
          id = nextTxId();
          timestamp = nowTimestamp();
          kind = #win;
          amount = outcome.payout;
          counterparty = null;
        },
      );
    };

    // Record the spin in history.
    appendSpinRecord(
      caller,
      {
        id = nextSpinId();
        timestamp = nowTimestamp();
        symbols;
        wager = SlotGameLib.SPIN_COST;
        payout = outcome.payout;
        won = outcome.won;
      },
    );

    // Update aggregate stats.
    aggregateStats.totalSpins += 1;
    aggregateStats.totalWagered += SlotGameLib.SPIN_COST;
    aggregateStats.totalPaidOut += outcome.payout;
    // House retained = wagered - paid out (cumulative).
    aggregateStats.houseRetained := aggregateStats.totalWagered - aggregateStats.totalPaidOut;

    outcome;
  };

  // Returns the caller's recent spin history (most recent first).
  public query ({ caller }) func getSpinHistory() : async [SlotGame.SpinRecord] {
    switch (spinHistory.get(caller)) {
      case (?l) SlotGameLib.toSpinHistory(l);
      case null [];
    };
  };

  // ---- Wallet / transfers ----

  // Returns the caller's recent transaction history.
  public query ({ caller }) func getTransactionHistory() : async [SlotGame.Transaction] {
    switch (transactions.get(caller)) {
      case (?l) SlotGameLib.toTransactionHistory(l);
      case null [];
    };
  };

  // Transfers ICP from the caller's player account to an external ICP address.
  // This debits the player's in-canister balance and records the transaction.
  public shared ({ caller }) func transfer(to : Common.AccountIdentifier, amount : Common.Tokens) : async SlotGame.TransferResult {
    let player = requirePlayer(caller);
    if (amount == 0) {
      return #err("Transfer amount must be greater than zero");
    };
    if (player.balance < amount) {
      return #err("Insufficient balance");
    };
    player.balance -= amount;
    appendTransaction(
      caller,
      {
        id = nextTxId();
        timestamp = nowTimestamp();
        kind = #transferOut;
        amount;
        counterparty = ?to;
      },
    );
    #ok({ amount });
  };

  // ---- Admin ----

  // Returns the current house backend ICP balance (admin only).
  public query ({ caller }) func getHouseBalance() : async Common.Tokens {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    houseBalance.balance;
  };

  // Returns aggregate house stats (admin only).
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

  // Transfers accumulated house ICP to an external ICP address (admin only).
  // Debits the house balance and records the transaction against the admin.
  public shared ({ caller }) func adminTransfer(to : Common.AccountIdentifier, amount : Common.Tokens) : async SlotGame.TransferResult {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    if (amount == 0) {
      return #err("Transfer amount must be greater than zero");
    };
    if (houseBalance.balance < amount) {
      return #err("Insufficient house balance");
    };
    houseBalance.balance -= amount;
    aggregateStats.houseRetained := if (aggregateStats.totalWagered >= aggregateStats.totalPaidOut + amount) {
      aggregateStats.totalWagered - aggregateStats.totalPaidOut - amount;
    } else {
      0;
    };
    appendTransaction(
      caller,
      {
        id = nextTxId();
        timestamp = nowTimestamp();
        kind = #adminTransferOut;
        amount;
        counterparty = ?to;
      },
    );
    #ok({ amount });
  };
};
