import Array "mo:core/Array";
import List "mo:core/List";
import Nat64 "mo:core/Nat64";
import Common "../types/common";
import SlotGame "../types/slot-game";

module {
  // Spin cost: 0.01 ICP = 1_000_000 e8s.
  public let SPIN_COST : Common.Tokens = 1_000_000;

  // Target payback rate: 98%.
  public let PAYBACK_RATE : Float = 0.98;

  // Number of reels.
  public let REEL_COUNT : Nat = 5;

  // Maximum number of spin records kept per player.
  public let SPIN_HISTORY_LIMIT : Nat = 20;

  // Maximum number of transaction records kept per player.
  public let TX_HISTORY_LIMIT : Nat = 20;

  // Symbol weights for reel generation. Lower-value symbols appear more
  // frequently so the expected payout converges to ~98% of the spin cost.
  // Index order matches the Symbol variant declaration order:
  // #cherry, #lemon, #bell, #seven, #bar, #diamond.
  let symbolWeights : [Nat] = [40, 30, 15, 8, 5, 2];
  // Sum of symbolWeights (40 + 30 + 15 + 8 + 5 + 2 = 100). Inlined as a
  // literal because module-level `let` requires a static expression.
  let weightTotal : Nat = 100;

  // Payout multipliers (in units of SPIN_COST) for matching N symbols of
  // the same kind on the payline. Only the longest run from the leftmost
  // reel counts (classic single-payline rule).
  // Index order: #cherry, #lemon, #bell, #seven, #bar, #diamond.
  // cherry pays on 2+; all others pay on 3+.
  let payoutTable : [{ fromCount : Nat; perSymbol : Nat }] = [
    { fromCount = 2; perSymbol = 1 }, // cherry: 2x=1, 3x=2, 4x=3, 5x=4
    { fromCount = 3; perSymbol = 2 }, // lemon: 3x=2, 4x=4, 5x=6
    { fromCount = 3; perSymbol = 4 }, // bell: 3x=4, 4x=8, 5x=12
    { fromCount = 3; perSymbol = 8 }, // seven: 3x=8, 4x=16, 5x=24
    { fromCount = 3; perSymbol = 16 }, // bar: 3x=16, 4x=32, 5x=48
    { fromCount = 3; perSymbol = 50 }, // diamond: 3x=50, 4x=100, 5x=150
  ];

  // Convert a Symbol variant to its index in the weight/payout tables.
  func symbolIndex(s : SlotGame.Symbol) : Nat {
    switch (s) {
      case (#cherry) 0;
      case (#lemon) 1;
      case (#bell) 2;
      case (#seven) 3;
      case (#bar) 4;
      case (#diamond) 5;
    };
  };

  func indexToSymbol(i : Nat) : SlotGame.Symbol {
    switch (i) {
      case 0 #cherry;
      case 1 #lemon;
      case 2 #bell;
      case 3 #seven;
      case 4 #bar;
      case 5 #diamond;
      case _ #cherry;
    };
  };

  // Pick a symbol from the weighted distribution given a draw in [0, weightTotal).
  func symbolFromDraw(draw : Nat) : SlotGame.Symbol {
    var remaining = draw;
    var idx = 0;
    for (w in symbolWeights.values()) {
      if (remaining < w) {
        return indexToSymbol(idx);
      };
      remaining -= w;
      idx += 1;
    };
    // Fallback (should not happen).
    #cherry;
  };

  // A simple xorshift PRNG seeded from a Nat. Returns the next state and a
  // value in [0, modulus). Uses Nat64 internally so we can use bitwise XOR.
  func xorshift(state : Nat, modulus : Nat) : (Nat, Nat) {
    var x : Nat64 = Nat64.fromNat(state) +% 1; // avoid zero seed
    x := Nat64.bitxor(x, Nat64.bitshiftRight(x, 12 : Nat64));
    x := Nat64.bitxor(x, Nat64.bitshiftLeft(x, 25 : Nat64));
    x := Nat64.bitxor(x, Nat64.bitshiftRight(x, 27 : Nat64));
    let result = x.toNat() % modulus;
    (x.toNat(), result);
  };

  // Generate a random spin result (5 symbols on the payline) given a seed.
  public func generateSpin(seed : Nat) : [SlotGame.Symbol] {
    var st = seed;
    Array.tabulate(REEL_COUNT, func(_i) {
      let (nextSt, draw) = xorshift(st, weightTotal);
      st := nextSt;
      symbolFromDraw(draw);
    });
  };

  // Compute the payout (in e8s) for a winning combination on the payline.
  // Only the longest left-aligned run of identical symbols counts.
  public func computePayout(symbols : [SlotGame.Symbol]) : Common.Tokens {
    if (symbols.size() < 2) return 0;
    let first = symbols[0];
    var runLen = 1;
    var i = 1;
    while (i < symbols.size() and symbolIndex(symbols[i]) == symbolIndex(first)) {
      runLen += 1;
      i += 1;
    };
    let entry = payoutTable[symbolIndex(first)];
    if (runLen < entry.fromCount) return 0;
    let multiplier = entry.perSymbol * runLen;
    SPIN_COST * multiplier;
  };

  // Evaluate a spin's outcome given the 5 landed symbols.
  public func evaluateSpin(symbols : [SlotGame.Symbol]) : SlotGame.SpinOutcome {
    let payout = computePayout(symbols);
    {
      symbols;
      won = payout > 0;
      payout;
    };
  };

  // Convert a Player internal record to its public view.
  public func toPlayerView(player : SlotGame.Player) : SlotGame.PlayerView {
    {
      id = player.id;
      balance = player.balance;
    };
  };

  // Convert a list of SpinRecord to its public array form (most recent first).
  public func toSpinHistory(records : List.List<SlotGame.SpinRecord>) : [SlotGame.SpinRecord] {
    records.toArray();
  };

  // Convert a list of Transaction to its public array form (most recent first).
  public func toTransactionHistory(txs : List.List<SlotGame.Transaction>) : [SlotGame.Transaction] {
    txs.toArray();
  };
};
