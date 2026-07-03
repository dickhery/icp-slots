import { PayTable } from "@/components/PayTable";
import { SlotMachine } from "@/components/SlotMachine";
import { SpinHistory } from "@/components/SpinHistory";
import { useSpinHistory } from "@/hooks/use-backend";

/**
 * Slot page: cabinet + payout table + recent spin history.
 * Single payline across five reels, 0.01 ICP per spin.
 */
export function SlotPage() {
  const { data: spins = [], isLoading } = useSpinHistory();

  return (
    <div className="space-y-8">
      <section data-ocid="slot.page">
        <SlotMachine />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section data-ocid="paytable.section">
          <PayTable />
        </section>
        <section data-ocid="spinhistory.section">
          <SpinHistory spins={spins} isLoading={isLoading} />
        </section>
      </div>
    </div>
  );
}
