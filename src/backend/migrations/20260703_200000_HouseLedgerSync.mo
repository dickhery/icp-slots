module {
  type OldHouseBalance = { var balance : Nat };

  type NewHouseBalance = {
    var balance : Nat;
    var creditedLedgerBalance : Nat;
  };

  public func migration(old : { houseBalance : OldHouseBalance }) : {
    houseBalance : NewHouseBalance;
  } {
    {
      houseBalance = {
        var balance = old.houseBalance.balance;
        var creditedLedgerBalance = 0;
      };
    };
  };
};