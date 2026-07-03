module {
  // Cross-cutting types shared across domains.

  // A user principal — the canonical identity on the Internet Computer.
  public type UserId = Principal;

  // Unix-style timestamp in nanoseconds (matches Time.now()).
  public type Timestamp = Nat;

  // ICP amounts are tracked in e8s (1 ICP = 100_000_000 e8s).
  public type Tokens = Nat;

  // An ICP ledger account identifier (32 bytes), used for external transfers.
  public type AccountIdentifier = Blob;

  // A subaccount (32 bytes) used to derive per-player accounts within the
  // backend canister's main ledger account.
  public type SubAccount = Blob;
};
