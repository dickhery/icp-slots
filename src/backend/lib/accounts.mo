import Principal "mo:core/Principal";
import Common "../types/common";

module {
  /**
   * Canonical 32-byte subaccount for the house vault (byte 0 = 1, rest zero).
   * All wagers, payouts, and admin-controlled house transfers use this account.
   */
  public let houseSubAccount : Common.SubAccount = "\01\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00";

  /** Compute the legacy ICP ledger account identifier for owner + subaccount. */
  public func accountIdentifier(
    owner : Principal,
    subaccount : Common.SubAccount,
  ) : Common.AccountIdentifier {
    owner.toLedgerAccount(?subaccount);
  };

  /** House vault deposit address (owner = backend canister, subaccount = house). */
  public func houseAccountIdentifier(owner : Principal) : Common.AccountIdentifier {
    owner.toLedgerAccount(?houseSubAccount);
  };

  /**
   * Canister default ledger account (no subaccount). This is retained only so
   * deposits sent to the address shown by older builds can be swept into the
   * canonical house vault.
   */
  public func defaultAccountIdentifier(owner : Principal) : Common.AccountIdentifier {
    owner.toLedgerAccount(null);
  };
};
