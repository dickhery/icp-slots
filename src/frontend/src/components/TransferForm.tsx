import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransfer } from "@/hooks/use-backend";
import { useBalance } from "@/hooks/use-balance";
import { formatIcp } from "@/types";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Send,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

/** ICP account identifiers are 32 bytes → 64 hex characters. */
const ACCOUNT_HEX_LENGTH = 64;
const ICP_DECIMALS = 8;

interface FieldErrors {
  address?: string;
  amount?: string;
}

/** Parse a decimal ICP amount string into e8s (bigint). Returns null if invalid. */
function parseIcpAmount(value: string): bigint | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length > ICP_DECIMALS) return null;
  const padded = (frac + "0".repeat(ICP_DECIMALS)).slice(0, ICP_DECIMALS);
  const e8s = BigInt(whole) * 10n ** BigInt(ICP_DECIMALS) + BigInt(padded);
  return e8s;
}

/** Convert a 64-char hex string to a Uint8Array (32 bytes). */
function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.trim().toLowerCase();
  if (clean.length !== ACCOUNT_HEX_LENGTH || !/^[0-9a-f]+$/.test(clean)) {
    return null;
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Transfer-out form. Validates an ICP account identifier (64-char hex) and
 * an amount, shows a confirmation dialog, then calls the backend `transfer`
 * method. Surfaces success via toast and inline error via an alert.
 */
export function TransferForm() {
  const { e8s, formatted } = useBalance();
  const transfer = useTransfer();

  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const balanceE8s = e8s ?? 0n;
  const amountE8s = parseIcpAmount(amount);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const bytes = hexToBytes(address);
    if (!bytes) {
      next.address = "Enter a valid 64-character hex ICP account identifier.";
    }
    if (!amountE8s) {
      next.amount = "Enter an amount greater than 0.";
    } else if (amountE8s > balanceE8s) {
      next.amount = "Amount exceeds your available balance.";
    }
    return next;
  };

  const handleBlur = () => {
    setTouched(true);
    setErrors(validate());
  };

  const openConfirm = () => {
    setSubmitError(null);
    const next = validate();
    setErrors(next);
    setTouched(true);
    if (Object.keys(next).length === 0) setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const bytes = hexToBytes(address);
    if (!bytes || !amountE8s) return;
    setSending(true);
    try {
      const result = await transfer(bytes, amountE8s);
      if (result.__kind__ === "ok") {
        toast.success("Transfer sent", {
          description: `${formatIcp(result.ok.amount)} ICP is on its way.`,
        });
        setAddress("");
        setAmount("");
        setErrors({});
        setTouched(false);
        setConfirmOpen(false);
      } else {
        setSubmitError(result.err || "Transfer failed. Please try again.");
        setConfirmOpen(false);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Network error. Please retry.";
      setSubmitError(msg);
      setConfirmOpen(false);
    } finally {
      setSending(false);
    }
  };

  const addressError = touched ? errors.address : undefined;
  const amountError = touched ? errors.amount : undefined;

  return (
    <Card className="border-primary/30 bg-card/70 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40 text-primary">
            <Send className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="font-display text-base font-700 uppercase tracking-wider">
              Send ICP
            </CardTitle>
            <CardDescription className="text-xs">
              Transfer from your wallet to any external ICP address
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {submitError && (
          <Alert variant="destructive" data-ocid="wallet.transfer.error_state">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Transfer failed</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label
            htmlFor="transfer-address"
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
          >
            Recipient account identifier
          </Label>
          <Input
            id="transfer-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={handleBlur}
            placeholder="e.g. 1d6e8a4f… (64 hex characters)"
            spellCheck={false}
            autoComplete="off"
            data-ocid="wallet.transfer.address_input"
            aria-invalid={!!addressError}
            className="font-mono text-sm"
          />
          {addressError && (
            <p
              className="text-xs text-destructive"
              data-ocid="wallet.transfer.address.field_error"
            >
              {addressError}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            The 64-character hex account ID shown by the recipient's wallet.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="transfer-amount"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Amount (ICP)
            </Label>
            <Badge
              variant="secondary"
              className="bg-accent/10 font-mono text-[10px] text-accent"
            >
              <Wallet className="size-3" aria-hidden="true" />
              {formatted} available
            </Badge>
          </div>
          <Input
            id="transfer-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={handleBlur}
            placeholder="0.00"
            data-ocid="wallet.transfer.amount_input"
            aria-invalid={!!amountError}
            className="font-mono text-sm"
          />
          {amountError ? (
            <p
              className="text-xs text-destructive"
              data-ocid="wallet.transfer.amount.field_error"
            >
              {amountError}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Transfers are sent immediately and cannot be reversed.
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={openConfirm}
          data-ocid="wallet.transfer.open_modal_button"
          className="w-full font-display uppercase tracking-wider"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
          Review transfer
        </Button>
      </CardContent>

      {/* Confirmation dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setSubmitError(null);
        }}
      >
        <DialogContent
          className="border-primary/30 bg-card"
          data-ocid="wallet.transfer.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Confirm transfer
            </DialogTitle>
            <DialogDescription>
              Review the details below before sending. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Amount
              </span>
              <span className="font-mono text-lg font-600 tabular-nums text-accent">
                {amountE8s ? formatIcp(amountE8s) : "—"} ICP
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                To
              </span>
              <p className="break-all font-mono text-xs text-foreground">
                {address.trim().toLowerCase()}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              data-ocid="wallet.transfer.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={sending}
              data-ocid="wallet.transfer.confirm_button"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Confirm & send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
