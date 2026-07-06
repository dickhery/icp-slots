import Map "mo:core/Map";
import List "mo:core/List";
import MixinViews "mo:caffeineai-data-viewer/MixinViews";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Common "types/common";
import SlotGame "types/slot-game";
import SlotGameApi "mixins/slot-game-api";

actor Backend {
  include MixinViews();

  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // ---- Slot-game stable state (initialized via migration chain) ----
  let players : Map.Map<Common.UserId, SlotGame.Player>;
  let spinHistory : Map.Map<Common.UserId, List.List<SlotGame.SpinRecord>>;
  let transactions : Map.Map<Common.UserId, List.List<SlotGame.Transaction>>;
  let houseBalance : {
    var balance : Common.Tokens;
    var creditedHouseLedger : Common.Tokens;
    var creditedDefaultLedger : Common.Tokens;
  };
  let aggregateStats : {
    var totalSpins : Nat;
    var totalWagered : Common.Tokens;
    var totalPaidOut : Common.Tokens;
    var houseRetained : Common.Tokens;
  };
  let counters : { var nextSpinId : Nat; var nextTxId : Nat };
  let maintenanceMode : { var enabled : Bool };

  include SlotGameApi(
    Backend,
    accessControlState,
    players,
    spinHistory,
    transactions,
    houseBalance,
    aggregateStats,
    counters,
    maintenanceMode,
  );
};