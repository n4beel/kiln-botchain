"use client";

import Link from "next/link";
import { useChainId, useReadContract } from "wagmi";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { isBotChainId } from "@/lib/botchain/chain";
import { getDeployment } from "@/lib/botchain/deployment";
import { kilnAbi } from "@/lib/botchain/abi";
import { parseTokenURI } from "@/lib/kiln";

interface TokenViewProps {
  id: bigint;
}

export default function TokenView({ id }: TokenViewProps) {
  const chainId = useChainId();
  const deployment = isBotChainId(chainId) ? getDeployment(chainId) : null;

  const {
    data: uriData,
    isLoading: isUriLoading,
    error: uriError,
  } = useReadContract({
    address: deployment?.address,
    abi: kilnAbi,
    functionName: "tokenURI",
    args: [id],
    query: { enabled: Boolean(deployment) },
  });

  const { data: ownerData } = useReadContract({
    address: deployment?.address,
    abi: kilnAbi,
    functionName: "ownerOf",
    args: [id],
    query: { enabled: Boolean(deployment) },
  });

  const { data: seedData } = useReadContract({
    address: deployment?.address,
    abi: kilnAbi,
    functionName: "seeds",
    args: [id],
    query: { enabled: Boolean(deployment) },
  });

  if (isUriLoading) {
    return (
      <Panel>
        <p className="text-sm text-zinc-500 animate-pulse">Loading piece from BOT Chain...</p>
      </Panel>
    );
  }

  if (uriError || !uriData) {
    return (
      <Panel>
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">Token #{id.toString()} does not exist on chain.</p>
          <Link href="/gallery">
            <Button variant="ghost">← View Gallery</Button>
          </Link>
        </div>
      </Panel>
    );
  }

  const metadata = parseTokenURI(uriData);

  return (
    <Panel>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {metadata?.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={metadata.image}
              alt={metadata.name || `Kiln #${id.toString()}`}
              className="w-80 h-80 rounded-lg border border-zinc-800 shadow-2xl"
            />
          ) : (
            <div className="w-80 h-80 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-xs text-zinc-500">
              Corrupted SVG
            </div>
          )}

          <div className="flex-1 space-y-4 w-full">
            <div>
              <h2 className="text-xl font-bold text-white">{metadata?.name || `Kiln #${id.toString()}`}</h2>
              <p className="text-xs text-zinc-400 mt-1">{metadata?.description || "On-chain generative SVG."}</p>
            </div>

            <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 space-y-2 text-xs">
              <div>
                <span className="text-zinc-500 block">Owner</span>
                <span className="text-zinc-200 font-mono break-all">{ownerData ?? "..."}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Seed (bytes32)</span>
                <span className="text-zinc-400 font-mono break-all">{seedData ?? "..."}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded border border-zinc-900 text-xs text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-400">100% On-Chain Provenance</p>
              <p>The SVG XML markup and metadata JSON are generated purely inside the smart contract during the view call. No external hosting required.</p>
            </div>

            <Link href="/gallery">
              <Button variant="ghost" className="w-full">Browse More in Gallery →</Button>
            </Link>
          </div>
        </div>
      </div>
    </Panel>
  );
}
