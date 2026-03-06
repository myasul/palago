type ListPageProps = {
  params: {
    type: string;
  };
};

export default function ListPage({ params }: ListPageProps) {
  return <main>List coming soon: {params.type}</main>;
}

