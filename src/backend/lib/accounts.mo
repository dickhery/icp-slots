import Principal "mo:core/Principal";
import Common "../types/common";

module {
  /** Dedicated 32-byte subaccount for house vault funding (byte 0 = 1, rest zero). */
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

  /** Canister default ledger account (no subaccount) — legacy house funding path. */
  public func defaultAccountIdentifier(owner : Principal) : Common.AccountIdentifier {
    owner.toLedgerAccount(null);
  };
};