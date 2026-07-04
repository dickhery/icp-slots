import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
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

  type OldSpinRecord = {
    id : Nat;
    timestamp : Nat;
    reels : [[Symbol]];
    activeLines : Nat;
    wager : Nat;
    payout : Nat;
    won : Bool;
    winningLines : [Nat];
  };

  type SpinRecord = {
    id : Nat;
    timestamp : Nat;
    reels : [[Symbol]];
    activeLines : Nat;
    betMultiplier : Nat;
    wager : Nat;
    payout : Nat;
    won : Bool;
    winningLines : [Nat];
  };

  func convertRecord(old : OldSpinRecord) : SpinRecord {
    {
      id = old.id;
      timestamp = old.timestamp;
      reels = old.reels;
      activeLines = old.activeLines;
      betMultiplier = 1;
      wager = old.wager;
      payout = old.payout;
      won = old.won;
      winningLines = old.winningLines;
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