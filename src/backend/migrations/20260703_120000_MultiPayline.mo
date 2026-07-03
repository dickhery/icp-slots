import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldSymbol = {
    #cherry;
    #lemon;
    #bell;
    #seven;
    #bar;
    #diamond;
  };

  type OldSpinRecord = {
    id : Nat;
    timestamp : Nat;
    symbols : [OldSymbol];
    wager : Nat;
    payout : Nat;
    won : Bool;
  };

  type Symbol = {
    #cherry;
    #lemon;
    #bell;
    #seven;
    #bar;
    #diamond;
    #star;
    #horseshoe;
  };

  type SpinRecord = {
    id : Nat;
    timestamp : Nat;
    reels : [[Symbol]];
    activeLines : Nat;
    wager : Nat;
    payout : Nat;
    won : Bool;
    winningLines : [Nat];
  };

  func toNewSymbol(s : OldSymbol) : Symbol {
    switch (s) {
      case (#cherry) #cherry;
      case (#lemon) #lemon;
      case (#bell) #bell;
      case (#seven) #seven;
      case (#bar) #bar;
      case (#diamond) #diamond;
    };
  };

  func reelColumn(mid : Symbol) : [Symbol] {
    Array.tabulate<Symbol>(3, func(row : Nat) {
      switch (row) {
        case 0 #lemon;
        case 1 mid;
        case 2 #cherry;
        case _ #cherry;
      };
    });
  };

  func convertRecord(old : OldSpinRecord) : SpinRecord {
    let reels = Array.tabulate<[Symbol]>(5, func(col : Nat) {
      let mid = if (col < old.symbols.size()) {
        toNewSymbol(old.symbols[col]);
      } else {
        #cherry;
      };
      reelColumn(mid);
    });
    {
      id = old.id;
      timestamp = old.timestamp;
      reels;
      activeLines = 1;
      wager = old.wager;
      payout = old.payout;
      won = old.won;
      winningLines = if (old.won) { [0] } else { [] : [Nat] };
    };
  };

  func convertHistory(list : List.List<OldSpinRecord>) : List.List<SpinRecord> {
    let next = List.empty<SpinRecord>();
    for (record in list.values()) {
      next.add(convertRecord(record));
    };
    next;
  };

  public func migration(old : { spinHistory : Map.Map<Principal, List.List<OldSpinRecord>> }) : {
    spinHistory : Map.Map<Principal, List.List<SpinRecord>>;
  } {
    let spinHistory = old.spinHistory.map<Principal, List.List<OldSpinRecord>, List.List<SpinRecord>>(
      func(_, records) { convertHistory(records) },
    );
    { spinHistory };
  };
};