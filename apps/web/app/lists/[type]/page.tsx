type ListPageProps = {
  params: Promise<{
    type: string;
  }>;
};

export default async function ListPage({ params }: ListPageProps) {
  const { type } = await params;

  return <main>List coming soon: {type}</main>;
}
