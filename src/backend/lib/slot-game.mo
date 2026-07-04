import Array "mo:core/Array";
import List "mo:core/List";
import Nat64 "mo:core/Nat64";
import Common "../types/common";
import SlotGame "../types/slot-game";

module {
  // Per-line spin cost: 0.01 ICP = 1_000_000 e8s.
  public let SPIN_COST : Common.Tokens = 1_000_000;

  // Target payback rate: 98%.
  public let PAYBACK_RATE : Float = 0.98;

  public let REEL_COUNT : Nat = 5;
  public let ROW_COUNT : Nat = 3;
  public let MAX_PAYLINES : Nat = 9;

  // Per-line bet multiplier: 1× (0.01 ICP) through 5× (0.05 ICP).
  public let MAX_BET_MULTIPLIER : Nat = 5;

  // Maximum number of spin records kept per player.
  public let SPIN_HISTORY_LIMIT : Nat = 20;

  // Maximum number of transaction records kept per player.
  public let TX_HISTORY_LIMIT : Nat = 20;

  // Symbol weights for reel generation. Lower-value symbols appear more
  // frequently so the expected payout converges to ~98% of the line bet.
  // Index order: #cherry, #lemon, #bell, #seven, #bar, #diamond, #star, #horseshoe.
  let symbolWeights : [Nat] = [30, 22, 14, 10, 8, 5, 6, 5];
  let weightTotal : Nat = 100;

  // Payout multipliers (in units of SPIN_COST) for matching N symbols of
  // the same kind on a payline. Only the longest left-aligned run counts.
  // Calibrated for ~98% RTP at max paylines (Monte Carlo over 5×3 grid).
  let payoutTable : [{ fromCount : Nat; perSymbol : Nat }] = [
    { fromCount = 2; perSymbol = 2 }, // cherry
    { fromCount = 3; perSymbol = 7 }, // lemon
    { fromCount = 3; perSymbol = 12 }, // bell
    { fromCount = 3; perSymbol = 23 }, // seven
    { fromCount = 3; perSymbol = 45 }, // bar
    { fromCount = 3; perSymbol = 126 }, // diamond
    { fromCount = 3; perSymbol = 18 }, // star
    { fromCount = 3; perSymbol = 9 }, // horseshoe
  ];

  // Nine classic paylines over a 3-row grid (row 0 = top, 1 = middle, 2 = bottom).
  let paylineDefs : [[Nat]] = [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0],
    [2, 2, 2, 2, 2],
    [0, 1, 2, 1, 0],
    [2, 1, 0, 1, 2],
    [1, 0, 0, 0, 1],
    [1, 2, 2, 2, 1],
    [0, 0, 1, 2, 2],
    [2, 2, 1, 0, 0],
  ];

  func symbolIndex(s : SlotGame.Symbol) : Nat {
    switch (s) {
      case (#cherry) 0;
      case (#lemon) 1;
      case (#bell) 2;
      case (#seven) 3;
      case (#bar) 4;
      case (#diamond) 5;
      case (#star) 6;
      case (#horseshoe) 7;
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
      case 6 #star;
      case 7 #horseshoe;
      case _ #cherry;
    };
  };

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
    #cherry;
  };

  func xorshift(state : Nat, modulus : Nat) : (Nat, Nat) {
    var x : Nat64 = Nat64.fromNat(state) +% 1;
    x := Nat64.bitxor(x, Nat64.bitshiftRight(x, 12 : Nat64));
    x := Nat64.bitxor(x, Nat64.bitshiftLeft(x, 25 : Nat64));
    x := Nat64.bitxor(x, Nat64.bitshiftRight(x, 27 : Nat64));
    let result = x.toNat() % modulus;
    (x.toNat(), result);
  };

  public func isValidLineCount(activeLines : Nat) : Bool {
    activeLines == 1 or activeLines == 3 or activeLines == 5 or activeLines == 9;
  };

  public func isValidBetMultiplier(betMultiplier : Nat) : Bool {
    betMultiplier >= 1 and betMultiplier <= MAX_BET_MULTIPLIER;
  };

  public func computeWager(activeLines : Nat, betMultiplier : Nat) : Common.Tokens {
    SPIN_COST * activeLines * betMultiplier;
  };

  public func generateSpin(seed : Nat) : SlotGame.ReelGrid {
    var st = seed;
    Array.tabulate(REEL_COUNT, func(_col) {
      Array.tabulate(ROW_COUNT, func(_row) {
        let (nextSt, draw) = xorshift(st, weightTotal);
        st := nextSt;
        symbolFromDraw(draw);
      });
    });
  };

  public func extractPayline(reels : SlotGame.ReelGrid, lineIndex : Nat) : [SlotGame.Symbol] {
    let def = paylineDefs[lineIndex];
    Array.tabulate(REEL_COUNT, func(col) {
      let row = def[col];
      reels[col][row];
    });
  };

  public func computePayout(symbols : [SlotGame.Symbol], betMultiplier : Nat) : Common.Tokens {
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
    SPIN_COST * multiplier * betMultiplier;
  };

  public func evaluateSpin(
    reels : SlotGame.ReelGrid,
    activeLines : Nat,
    betMultiplier : Nat,
  ) : SlotGame.SpinOutcome {
    var totalPayout : Common.Tokens = 0;
    let winning = List.empty<Nat>();
    var lineIdx = 0;
    while (lineIdx < activeLines and lineIdx < MAX_PAYLINES) {
      let lineSymbols = extractPayline(reels, lineIdx);
      let linePayout = computePayout(lineSymbols, betMultiplier);
      if (linePayout > 0) {
        totalPayout += linePayout;
        winning.add(lineIdx);
      };
      lineIdx += 1;
    };
    {
      reels;
      activeLines;
      betMultiplier;
      wager = computeWager(activeLines, betMultiplier);
      won = totalPayout > 0;
      payout = totalPayout;
      winningLines = winning.toArray();
    };
  };

  public func toPlayerView(player : SlotGame.Player) : SlotGame.PlayerView {
    {
      id = player.id;
      balance = player.balance;
    };
  };

  public func toSpinHistory(records : List.List<SlotGame.SpinRecord>) : [SlotGame.SpinRecord] {
    let arr = records.toArray();
    Array.tabulate(arr.size(), func(i) { arr[arr.size() - 1 - i] });
  };

  public func toTransactionHistory(txs : List.List<SlotGame.Transaction>) : [SlotGame.Transaction] {
    txs.toArray();
  };
};