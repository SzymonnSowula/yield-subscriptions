import { BN } from "@coral-xyz/anchor";

export const USDC_DECIMALS = 6;
const USDC_SCALE = 10n ** BigInt(USDC_DECIMALS);

export function parseUsdcToBn(value: string): BN {
  const normalized = value.trim();

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Enter a valid USDC amount");
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const paddedFraction = (fractionalPart + "0".repeat(USDC_DECIMALS)).slice(0, USDC_DECIMALS);
  const units = BigInt(wholePart) * USDC_SCALE + BigInt(paddedFraction || "0");

  return new BN(units.toString());
}

export function formatUsdc(value: BN | number | bigint | string): string {
  const units =
    value instanceof BN
      ? BigInt(value.toString())
      : typeof value === "bigint"
      ? value
      : BigInt(value);

  const whole = units / USDC_SCALE;
  const fraction = (units % USDC_SCALE).toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function periodDaysToSeconds(days: number): BN {
  return new BN((days * 24 * 60 * 60).toString());
}

export function periodSecondsToDays(periodSeconds: BN): number {
  return Number(periodSeconds.toString()) / 86400;
}
