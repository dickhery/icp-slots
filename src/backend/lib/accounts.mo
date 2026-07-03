import Principal "mo:core/Principal";
import Common "../types/common";

module {
  /** Compute the legacy ICP ledger account identifier for owner + subaccount. */
  public func accountIdentifier(
    owner : Principal,
    subaccount : Common.SubAccount,
  ) : Common.AccountIdentifier {
    owner.toLedgerAccount(?subaccount);
  };

  /** Compute the canister's default (no subaccount) ICP deposit address. */
  public func defaultAccountIdentifier(owner : Principal) : Common.AccountIdentifier {
    owner.toLedgerAccount(null);
  };
};