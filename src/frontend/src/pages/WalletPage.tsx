import { BalanceCard } from "@/components/BalanceCard";
import { DepositAccountCard } from "@/components/DepositAccountCard";
import { TransactionHistory } from "@/components/TransactionHistory";
import { TransferForm } from "@/components/TransferForm";

/**
 * Wallet page — the player's ICP command center. Three distinct zones:
 * the hero balance card, the transfer form, and the transaction history.
 * Layout stacks on mobile and forms a two-column grid on large screens.
 */
export function WalletPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-700 tracking-tight text-foreground">
          Wallet
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your ICP balance, send funds to any account, and review your
          activity.
        </p>
      </header>

      {/* Hero balance — full width */}
      <section data-ocid="wallet.balance.section">
        <BalanceCard />
      </section>

      <section data-ocid="wallet.deposit.section">
        <DepositAccountCard />
      </section>

      {/* Transfer + history — two columns on large screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section data-ocid="wallet.transfer.section">
          <TransferForm />
        </section>
        <section data-ocid="wallet.history.section">
          <TransactionHistory />
        </section>
      </div>
    </div>
  );
}
