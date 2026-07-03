import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface SpinRecord {
    id: bigint;
    won: boolean;
    winningLines: Array<bigint>;
    timestamp: Timestamp;
    wager: Tokens;
    activeLines: bigint;
    reels: ReelGrid;
    payout: Tokens;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type ReelGrid = Array<Array<Symbol>>;
export interface Transaction {
    id: bigint;
    kind: TxKind;
    counterparty?: AccountIdentifier;
    timestamp: Timestamp;
    amount: Tokens;
}
export type UserId = Principal;
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type TransferResult = {
    __kind__: "ok";
    ok: {
        amount: Tokens;
    };
} | {
    __kind__: "err";
    err: string;
};
export type AccountIdentifier = Uint8Array;
export interface SpinOutcome {
    won: boolean;
    winningLines: Array<bigint>;
    wager: Tokens;
    activeLines: bigint;
    reels: ReelGrid;
    payout: Tokens;
}
export interface PlayerView {
    id: UserId;
    balance: Tokens;
}
export interface HouseStats {
    totalWagered: Tokens;
    totalPaidOut: Tokens;
    totalSpins: bigint;
    houseRetained: Tokens;
    houseBalance: Tokens;
}
export type Tokens = bigint;
export enum Symbol {
    bar = "bar",
    bell = "bell",
    star = "star",
    diamond = "diamond",
    horseshoe = "horseshoe",
    lemon = "lemon",
    seven = "seven",
    cherry = "cherry"
}
export enum TxKind {
    win = "win",
    spinCost = "spinCost",
    transferOut = "transferOut",
    transferIn = "transferIn",
    adminTransferOut = "adminTransferOut"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminTransfer(to: AccountIdentifier, amount: Tokens): Promise<TransferResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getBalance(): Promise<Tokens>;
    getCallerUserRole(): Promise<UserRole>;
    getHouseBalance(): Promise<Tokens>;
    getHouseStats(): Promise<HouseStats>;
    getOrCreatePlayer(): Promise<PlayerView>;
    getSpinHistory(): Promise<Array<SpinRecord>>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    isCallerAdmin(): Promise<boolean>;
    spin(activeLines: bigint): Promise<SpinOutcome>;
    transfer(to: AccountIdentifier, amount: Tokens): Promise<TransferResult>;
}
