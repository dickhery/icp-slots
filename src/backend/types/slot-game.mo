import Common "common";

module {
  // Classic slot machine symbols.
  public type Symbol = {
    #cherry;
    #lemon;
    #bell;
    #seven;
    #bar;
    #diamond;
  };

  // A single spin result: the 5 symbols that landed on the payline.
  public type ReelResult = { symbols : [Symbol] };

  // The outcome of a spin: the reels, whether it won, and the payout.
  public type SpinOutcome = {
    symbols : [Symbol];
    won : Bool;
    payout : Common.Tokens;
  };

  // A historical spin record for a player.
  public type SpinRecord = {
    id : Nat;
    timestamp : Common.Timestamp;
    symbols : [Symbol];
    wager : Common.Tokens;
    payout : Common.Tokens;
    won : Bool;
  };

  // A player's wallet transaction record.
  public type TxKind = {
    #spinCost;
    #win;
    #transferOut;
    #transferIn;
    #adminTransferOut;
  };

  public type Transaction = {
    id : Nat;
    timestamp : Common.Timestamp;
    kind : TxKind;
    amount : Common.Tokens;
    counterparty : ?Common.AccountIdentifier;
  };

  // A registered player's state.
  public type Player = {
    id : Common.UserId;
    subAccount : Common.SubAccount;
    var balance : Common.Tokens;
  };

  // Public (shared) view of a player.
  public type PlayerView = {
    id : Common.UserId;
    balance : Common.Tokens;
  };

  // Aggregate house stats (admin view).
  public type HouseStats = {
    totalSpins : Nat;
    totalWagered : Common.Tokens;
    totalPaidOut : Common.Tokens;
    houseRetained : Common.Tokens;
    houseBalance : Common.Tokens;
  };

  // Result of a transfer request.
  public type TransferResult = {
    #ok : { amount : Common.Tokens };
    #err : Text;
  };
};
