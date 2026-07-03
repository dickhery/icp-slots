module {
  type OldHouseBalance = {
    var balance : Nat;
    var creditedLedgerBalance : Nat;
  };

  type NewHouseBalance = {
    var balance : Nat;
    var creditedHouseLedger : Nat;
    var creditedDefaultLedger : Nat;
  };

  public func migration(old : { houseBalance : OldHouseBalance }) : {
    houseBalance : NewHouseBalance;
  } {
    {
      houseBalance = {
        var balance = old.houseBalance.balance;
        // Prior credits were tracked as a single ledger total; attribute to the
        // default account so re-sync does not double-credit existing deposits.
        var creditedHouseLedger = 0;
        var creditedDefaultLedger = old.houseBalance.creditedLedgerBalance;
      };
    };
  };
};