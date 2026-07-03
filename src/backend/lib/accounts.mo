import Blob "mo:core/Blob";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Common "../types/common";

module {
  /**
   * A previous build accidentally used this 33-byte value as the house
   * subaccount. It is invalid for ICRC accounts and is retained only so the
   * admin sync can detect funds sent to the old, unspendable account ID.
   */
  let malformedHouseSubAccount : Blob = "\01\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00";

  /** Compute the legacy ICP ledger account identifier for owner + subaccount. */
  public func accountIdentifier(
    owner : Principal,
    subaccount : Common.SubAccount,
  ) : Common.AccountIdentifier {
    if (subaccount.size() != 32) {
      Runtime.trap("ICP subaccounts must contain exactly 32 bytes");
    };
    owner.toLedgerAccount(?subaccount);
  };

  /**
   * Canonical house vault: the backend canister's default ledger account.
   * Player funds remain isolated in their own 32-byte subaccounts.
   */
  public func houseAccountIdentifier(owner : Principal) : Common.AccountIdentifier {
    owner.toLedgerAccount(null);
  };

  /** Backward-compatible alias for the canonical house account identifier. */
  public func defaultAccountIdentifier(owner : Principal) : Common.AccountIdentifier {
    houseAccountIdentifier(owner);
  };

  /** Account ID produced by the prior malformed subaccount bug (diagnostic only). */
  public func malformedHouseAccountIdentifier(owner : Principal) : Common.AccountIdentifier {
    owner.toLedgerAccount(?malformedHouseSubAccount);
  };
};
