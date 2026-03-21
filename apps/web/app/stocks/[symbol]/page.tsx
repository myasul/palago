type StockDetailPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function StockDetailPage({
  params,
}: StockDetailPageProps) {
  const { symbol } = await params;

  return <main>Stock detail coming soon: {symbol}</main>;
}
