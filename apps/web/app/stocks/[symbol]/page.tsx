type StockDetailPageProps = {
  params: {
    symbol: string;
  };
};

export default function StockDetailPage({ params }: StockDetailPageProps) {
  return <main>Stock detail coming soon: {params.symbol}</main>;
}

