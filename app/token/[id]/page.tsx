import PageShell from "@/components/layout/PageShell";
import TokenView from "@/components/kiln/TokenView";
import { NAV } from "@/lib/nav";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TokenPage({ params }: PageProps) {
  const { id } = await params;
  const tokenId = BigInt(id);

  return (
    <PageShell
      nav={NAV}
      title={`Kiln #${id}`}
      description={`Generative on-chain SVG artwork for token #${id}`}
    >
      <TokenView id={tokenId} />
    </PageShell>
  );
}
