import { TRADE_INSTRUMENTS } from "@/lib/mock-data";

export function generateStaticParams() {
  return TRADE_INSTRUMENTS.map((i) => ({ symbol: i.symbol }));
}

export default function TradeSymbolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
