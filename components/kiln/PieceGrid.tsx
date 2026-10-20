"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAccount, useChainId, usePublicClient, useReadContracts } from "wagmi";
import Panel from "@/components/ui/Panel";
import Spinner from "@/components/ui/Spinner";
import { isBotChainId } from "@/lib/botchain/chain";
import { getDeployment, isDeployed } from "@/lib/botchain/deployment";
import { kilnAbi } from "@/lib/botchain/abi";
import { parseTokenURI } from "@/lib/kiln";

const ZERO = "0x0000000000000000000000000000000000000000";

/**
 * The pieces that exist, and which of them are yours.
 *
 * The contract's token counter is private and there is no enumerable extension, so there is no
 * totalSupply to ask for — but every mint emits Transfer from the zero address, which makes the
 * log the index. A page called Gallery that could only show one token at a time, if you already
 * knew its number, was not showing a gallery.
 *
 * Ownership is read back with ownerOf rather than inferred from the transfer history: these are
 * transferable, so the last Transfer is the truth and re-deriving it from logs is work the
 * contract will do for us.
 */
type TransferEvent = Extract<(typeof kilnAbi)[number], { type: "event"; name: "Transfer" }>;

/** Taken from the ABI itself; re-typing the signature here is how the two drift apart. */
const TRANSFER = kilnAbi.find(
  (item): item is TransferEvent => item.type === "event" && item.name === "Transfer",
)!;

export default function PieceGrid({ mineOnly = false }: { mineOnly?: boolean }) {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient(); // stable-hook-result

  const [ids, setIds] = useState<bigint[] | null>(null);
  const [failed, setFailed] = useState(false);

  const ready = isBotChainId(chainId) && isDeployed(chainId);
  const deployment = ready ? getDeployment(chainId) : null;
  const contract = deployment?.address;
  const fromBlock = deployment?.deployBlock;

  const scanned = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !publicClient || !contract || fromBlock === undefined) return;
    const key = String(chainId);
    if (scanned.current === key) return;
    scanned.current = key;

    let cancelled = false;
    void (async () => {
      try {
        // Mints only: every token appears here exactly once, whoever holds it now.
        const mints = await publicClient.getLogs({
          address: contract, event: TRANSFER, args: { from: ZERO }, fromBlock,
        });
        if (cancelled) return;
        const found = mints
          .map((l) => l.args.tokenId)
          .filter((id): id is bigint => id !== undefined)
          .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)); // newest first
        setIds([...new Set(found.map(String))].map(BigInt));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, publicClient, contract, fromBlock, chainId]);

  const data = useReadContracts({
    contracts: (ids ?? []).flatMap((id) => [
      { address: contract, abi: kilnAbi, functionName: "ownerOf" as const, args: [id] as const },
      { address: contract, abi: kilnAbi, functionName: "tokenURI" as const, args: [id] as const },
    ]),
    query: { enabled: Boolean(ids?.length) && Boolean(contract) },
  });

  const pieces = useMemo(() => {
    if (!ids) return [];
    return ids.map((id, i) => {
      const owner = data.data?.[i * 2]?.result as `0x${string}` | undefined;
      const uri = data.data?.[i * 2 + 1]?.result as string | undefined;
      return { id, owner, image: uri ? parseTokenURI(uri)?.image : undefined };
    });
  }, [ids, data.data]);

  const shown = mineOnly
    ? pieces.filter((p) => address && p.owner?.toLowerCase() === address.toLowerCase())
    : pieces;

  const title = mineOnly ? "Your pieces" : "Every piece";

  if (!ready) return null;
  if (mineOnly && !address) return null;

  if (failed) {
    return (
      <Panel>
        <p className="text-xs text-zinc-400">
          Could not list pieces — the node refused the log query. Any piece is still reachable by
          its number.
        </p>
      </Panel>
    );
  }

  if (ids === null) {
    return (
      <Panel>
        <Spinner label="Reading pieces from the chain" />
      </Panel>
    );
  }

  if (shown.length === 0) {
    return (
      <Panel>
        <p className="text-xs text-zinc-400">
          {mineOnly
            ? "This wallet holds no pieces yet. Mint one and it appears here."
            : "Nothing minted yet. Be the first."}
        </p>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">
          {title} ({shown.length})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {shown.map((p) => {
            const mine =
              address && p.owner?.toLowerCase() === address.toLowerCase();
            return (
              <Link
                key={p.id.toString()}
                href={`/token/${p.id.toString()}`}
                className="group block no-underline"
              >
                <div
                  className="aspect-square rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900 group-hover:border-zinc-600 transition-colors"
                >
                  {p.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.image}
                      alt={`Kiln #${p.id.toString()}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">
                      loading
                    </div>
                  )}
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="font-mono text-xs text-zinc-300">#{p.id.toString()}</span>
                  {mine && !mineOnly && (
                    <span className="text-[10px] uppercase tracking-wide text-amber-400">yours</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
