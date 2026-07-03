import { SPIN_COST_E8S, formatIcp } from "@/types";

const PAYBACK_NOTE =
  "Single payline · 5 reels · classic symbols. Payouts are credited to your wallet instantly on every winning spin.";

export function Footer() {
  const year = new Date().getFullYear();
  const host =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(host)}`;

  return (
    <footer className="border-t border-border/70 bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-2">
            <p className="font-display text-sm font-700 uppercase tracking-wider text-foreground">
              Neon Vault Slots
            </p>
            <p className="text-sm text-muted-foreground">{PAYBACK_NOTE}</p>
            <p className="font-mono text-xs text-accent/80">
              Spin cost · {formatIcp(SPIN_COST_E8S)} ICP
            </p>
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:items-end">
            <span className="font-mono uppercase tracking-wider">
              Built on Internet Computer
            </span>
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-smooth hover:text-accent"
            >
              © {year}. Built with love using caffeine.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
