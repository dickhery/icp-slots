import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminTransfer, useHouseBalance } from "@/hooks/use-backend";
import type { AccountIdentifier, TransferResult } from "@/types";
import { ICP_LEDGER_FEE_E8S, formatIcp } from "@/types";
import { Send, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** ICP account identifiers are 32 bytes represented as 64 hex chars. */
const ACCOUNT_HEX_LENGTH = 64;

/** Parse a hex string into a Uint8Array, returning null on invalid input. */
function parseHexAccount(hex: string): Uint8Array | null {
  const clean = hex.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]+$/.test(clean)) return null;
  if (clean.length !== ACCOUNT_HEX_LENGTH) return null;
  const bytes = new Uint8Array(ACCOUNT_HEX_LENGTH / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Parse a decimal ICP amount string into e8s (bigint). */
function parseIcpAmount(input: string): bigint | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  const paddedFrac = `${frac}00000000`.slice(0, 8);
  return BigInt(whole) * 10n ** 8n + BigInt(paddedFrac);
}

/**
 * Admin-only form to transfer accumulated house ICP to an external
 * ICP account identifier. Validates the hex address and amount, then
 * calls the adminTransfer backend method.
 */
export function AdminTransferForm() {
  const { data: balance } = useHouseBalance();
  const adminTransfer = useAdminTransfer();

  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxBalance = balance ?? 0n;

  const validateAddress = (value: string): string | null => {
    if (!value.trim()) return "Account address is required";
    if (!parseHexAccount(value)) {
      return "Enter a valid 64-character hex account identifier";
    }
    return null;
  };

  const validateAmount = (value: string): string | null => {
    if (!value.trim()) return "Amount is required";
    const e8s = parseIcpAmount(value);
    if (e8s === null) return "Enter a valid ICP amount (e.g. 1.25)";
    if (e8s <= 0n) return "Amount must be greater than 0";
    if (e8s + ICP_LEDGER_FEE_E8S > maxBalance) {
      return `Amount plus the ledger fee exceeds house balance (${formatIcp(maxBalance)} ICP)`;
    }
    return null;
  };

  const handleAddressBlur = () => {
    setAddressError(validateAddress(address));
  };

  const handleAmountBlur = () => {
    setAmountError(validateAmount(amount));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const addrErr = validateAddress(address);
    const amtErr = validateAmount(amount);
    setAddressError(addrErr);
    setAmountError(amtErr);
    if (addrErr || amtErr) return;

    const to = parseHexAccount(address) as AccountIdentifier;
    const e8s = parseIcpAmount(amount) as bigint;

    setIsSubmitting(true);
    try {
      const result: TransferResult = await adminTransfer(to, e8s);
      if (result.__kind__ === "ok") {
        toast.success(`Transferred ${formatIcp(result.ok.amount)} ICP`, {
          description: `Confirmed at block ${result.ok.blockIndex.toString()} (${formatIcp(result.ok.fee)} ICP fee).`,
        });
        setAddress("");
        setAmount("");
        setAddressError(null);
        setAmountError(null);
      } else {
        setSubmitError(result.err);
        toast.error("Transfer failed", { description: result.err });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setSubmitError(msg);
      toast.error("Transfer failed", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmittingState = isSubmitting;

  return (
    <Card
      className="border-primary/30 bg-card/80 backdrop-blur-sm"
      data-ocid="admin.transfer_form.card"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40 text-primary">
            <Send className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-0.5">
            <CardTitle className="font-display text-base font-600 tracking-tight">
              Transfer House ICP
            </CardTitle>
            <CardDescription className="text-xs">
              Send accumulated house balance to an external ICP account
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Recipient address */}
          <div className="space-y-2">
            <Label
              htmlFor="transfer-address"
              className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              Recipient Account Identifier
            </Label>
            <Input
              id="transfer-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={handleAddressBlur}
              placeholder="e.g. 1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!!addressError}
              data-ocid="admin.transfer_form.address_input"
              className="font-mono text-sm"
            />
            {addressError && (
              <p
                className="text-xs text-destructive"
                data-ocid="admin.transfer_form.address.field_error"
              >
                {addressError}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              64-character hexadecimal ICP account identifier
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label
              htmlFor="transfer-amount"
              className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              Amount (ICP)
            </Label>
            <Input
              id="transfer-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={handleAmountBlur}
              placeholder="e.g. 1.25"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!!amountError}
              data-ocid="admin.transfer_form.amount_input"
              className="font-mono text-sm"
            />
            {amountError && (
              <p
                className="text-xs text-destructive"
                data-ocid="admin.transfer_form.amount.field_error"
              >
                {amountError}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Available: {formatIcp(maxBalance)} ICP
            </p>
          </div>

          {/* Submit error */}
          {submitError && (
            <Alert
              variant="destructive"
              data-ocid="admin.transfer_form.error_state"
            >
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>Transfer failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              disabled={isSubmittingState}
              data-ocid="admin.transfer_form.submit_button"
              className="font-display text-sm font-600 uppercase tracking-wider"
            >
              {isSubmittingState ? "Sending…" : "Transfer ICP"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAddress("");
                setAmount("");
                setAddressError(null);
                setAmountError(null);
                setSubmitError(null);
              }}
              disabled={isSubmittingState}
              data-ocid="admin.transfer_form.cancel_button"
              className="text-muted-foreground"
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
