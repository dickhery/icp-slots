import Principal "mo:core/Principal";
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
    #star;
    #horseshoe;
  };

  // A 5-reel × 3-row grid. Outer index is reel (column), inner is row (0=top).
  public type ReelGrid = [[Symbol]];

  // The outcome of a spin: full reel grid, active lines, and total payout.
  public type SpinOutcome = {
    reels : ReelGrid;
    activeLines : Nat;
    wager : Common.Tokens;
    won : Bool;
    payout : Common.Tokens;
    winningLines : [Nat];
  };

  // A historical spin record for a player.
  public type SpinRecord = {
    id : Nat;
    timestamp : Common.Timestamp;
    reels : ReelGrid;
    activeLines : Nat;
    wager : Common.Tokens;
    payout : Common.Tokens;
    won : Bool;
    winningLines : [Nat];
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
    /** Ledger balance already credited to the in-canister playable balance. */
    var creditedLedgerBalance : Common.Tokens;
  };

  // Public (shared) view of a player.
  public type PlayerView = {
    id : Common.UserId;
    balance : Common.Tokens;
  };

  // ICP deposit address for sending funds to a player or the canister.
  public type DepositAccountView = {
    accountId : Common.AccountIdentifier;
    /** Optional alternate account (house subaccount) for advanced deposits. */
    legacyAccountId : ?Common.AccountIdentifier;
    canisterId : Principal;
  };

  // Result of syncing ledger deposits into the playable balance.
  public type SyncDepositResult = {
    credited : Common.Tokens;
    balance : Common.Tokens;
    ledgerHouse : Common.Tokens;
    ledgerDefault : Common.Tokens;
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