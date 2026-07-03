import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldPlayer = {
    id : Principal;
    subAccount : Blob;
    var balance : Nat;
  };

  type NewPlayer = {
    id : Principal;
    subAccount : Blob;
    var balance : Nat;
    var creditedLedgerBalance : Nat;
  };

  public func migration(old : { players : Map.Map<Principal, OldPlayer> }) : {
    players : Map.Map<Principal, NewPlayer>;
  } {
    let players = old.players.map<Principal, OldPlayer, NewPlayer>(
      func(_, player) {
        {
          id = player.id;
          subAccount = player.subAccount;
          var balance = player.balance;
          var creditedLedgerBalance = 0;
        };
      },
    );
    { players };
  };
};