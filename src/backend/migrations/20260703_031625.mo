import Map "mo:core/Map";
import List "mo:core/List";

module {
  // First migration: introduces stable state for the slot-game domain.
  // The previous actor had no stable fields, so OldActor is empty.

  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  // Inlined slot-game types (migrations must be self-contained — only
  // mo:core/... imports are allowed, never project modules).
  type Symbol = {
    #cherry;
    #lemon;
    #bell;
    #seven;
    #bar;
    #diamond;
  };

  type SpinRecord = {
    id : Nat;
    timestamp : Nat;
    symbols : [Symbol];
    wager : Nat;
    payout : Nat;
    won : Bool;
  };

  type TxKind = {
    #spinCost;
    #win;
    #transferOut;
    #transferIn;
    #adminTransferOut;
  };

  type Transaction = {
    id : Nat;
    timestamp : Nat;
    kind : TxKind;
    amount : Nat;
    counterparty : ?Blob;
  };

  type Player = {
    id : Principal;
    subAccount : Blob;
    var balance : Nat;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type OldActor = {};

  type NewActor = {
    var accessControlState : AccessControlState;
    var players : Map.Map<Principal, Player>;
    var spinHistory : Map.Map<Principal, List.List<SpinRecord>>;
    var transactions : Map.Map<Principal, List.List<Transaction>>;
    var houseBalance : { var balance : Nat };
    var aggregateStats : {
      var totalSpins : Nat;
      var totalWagered : Nat;
      var totalPaidOut : Nat;
      var houseRetained : Nat;
    };
    var counters : { var nextSpinId : Nat; var nextTxId : Nat };
  };

  public func migration(_old : OldActor) : NewActor {
    {
      var accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      var players = Map.empty();
      var spinHistory = Map.empty();
      var transactions = Map.empty();
      var houseBalance = { var balance = 0 : Nat };
      var aggregateStats = {
        var totalSpins = 0 : Nat;
        var totalWagered = 0 : Nat;
        var totalPaidOut = 0 : Nat;
        var houseRetained = 0 : Nat;
      };
      var counters = { var nextSpinId = 0 : Nat; var nextTxId = 0 : Nat };
    };
  };
};
