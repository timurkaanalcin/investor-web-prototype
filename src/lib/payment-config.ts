/** Mock payment destinations — prototype only, no real transfers. */

export const MOCK_CRYPTO = {
  network: "TRC20",
  asset: "USDT",
  address: "TXk9mP2vQr7nLw4HsYc8FdUaB3eGj1KpZo",
  label: "USDT (TRC20)",
} as const;

export const MOCK_IBAN = {
  bank: "Garanti BBVA",
  iban: "TR33 0006 2000 1230 0006 9876 54",
  holderName: "Investor Ödeme A.Ş.",
  descriptionHint: "Açıklamaya adınızı yazın",
} as const;

export const MOCK_CARD_NOTE =
  "Kart ile ödeme simülasyonu — gerçek tahsilat yapılmaz. Talep yine admin onayı bekler.";

export const ADMIN_PIN = "1234";

export const SCREENSHOT_MAX_BYTES = 1_500_000; // ~1.5 MB
export const SCREENSHOT_WARN_BYTES = 1_000_000; // warn above ~1 MB
