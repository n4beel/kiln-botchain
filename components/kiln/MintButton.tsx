"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BaseError,
  ContractFunctionRevertedError,
  parseEventLogs,
  type Hex,
} from "viem";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import BotChainGate from "@/components/botchain/BotChainGate";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import TxStatus, { type TxStage } from "@/components/ui/TxStatus";
import { useToast } from "@/components/ui/Toast";
import { isBotChainId } from "@/lib/botchain/chain";
import { getDeployment } from "@/lib/botchain/deployment";
import { kilnAbi } from "@/lib/botchain/abi";
import { svgFromTokenURI } from "@/lib/kiln";

export default function MintButton() {
  return (
    <BotChainGate noWalletNote="Connect a native BOT Chain wallet to mint generative SVG NFTs.">
      <MintButtonInner />
    </BotChainGate>
  );
}

function MintButtonInner() {
  const chainId = useChainId();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();

  const [stage, setStage] = useState<TxStage>("idle");
  const [hash, setHash] = useState<Hex | null>(null);
  const [mintedId, setMintedId] = useState<bigint | null>(null);

  const deployment = isBotChainId(chainId) ? getDeployment(chainId) : null;

  const receipt = useWaitForTransactionReceipt({
    hash: hash ?? undefined,
    query: { enabled: Boolean(hash) },
  });

  const settledHash = useRef<Hex | null>(null);

  useEffect(() => {
    if (!hash || settledHash.current === hash) return;
    if (!receipt.isSuccess && !receipt.isError) return;

    settledHash.current = hash;

    if (receipt.isSuccess) {
      setStage("confirmed");
      toast("success", "NFT Minted", "Your generative Kiln piece is now on-chain.");

      if (receipt.data?.logs) {
        try {
          const logs = parseEventLogs({
            abi: kilnAbi,
            eventName: "Transfer",
            logs: receipt.data.logs,
          });
          const mintLog = logs.find((l) => l.args?.from === "0x0000000000000000000000000000000000000000");
          if (mintLog && mintLog.args?.tokenId !== undefined) {
            setMintedId(mintLog.args.tokenId);
          }
        } catch {
          // ignore log parse issues
        }
      }
    } else {
      setStage("failed");
      toast("error", "Mint failed", "Transaction reverted. Check the explorer and try again.");
    }
  }, [hash, receipt.isSuccess, receipt.isError, receipt.data, toast]);

  const { data: tokenURIData } = useReadContract({
    address: deployment?.address,
    abi: kilnAbi,
    functionName: "tokenURI",
    args: mintedId !== null ? [mintedId] : undefined,
    query: { enabled: Boolean(deployment && mintedId !== null) },
  });

  const handleMint = useCallback(async () => {
    if (!deployment || !isBotChainId(chainId)) return;

    setStage("signing");
    try {
      const txHash = await writeContractAsync({
        address: deployment.address,
        abi: kilnAbi,
        functionName: "mint",
      });
      setHash(txHash);
      setStage("pending");
      toast("info", "Mint submitted", "Generating on-chain SVG from block entropy...");
    } catch (err) {
      setStage("failed");
      if (err instanceof BaseError) {
        const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
        if (revert instanceof ContractFunctionRevertedError) {
          toast("error", "Mint rejected", revert.data?.errorName ?? revert.message);
          return;
        }
      }
      toast("error", "Mint cancelled", err instanceof Error ? err.message : "Reverted");
    }
  }, [deployment, chainId, writeContractAsync, toast]);

  const imageSrc = tokenURIData ? svgFromTokenURI(tokenURIData) : null;

  if (stage === "confirmed") {
    return (
      <Panel>
        <div className="space-y-4 text-center">
          <h2 className="text-base font-semibold text-white">Piece Revealed!</h2>
          {mintedId !== null && (
            <p className="text-xs text-zinc-400">Kiln Token #{mintedId.toString()}</p>
          )}

          {imageSrc ? (
            <div className="flex justify-center my-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={mintedId ? `Kiln #${mintedId.toString()}` : "Kiln NFT"}
                className="w-72 h-72 rounded-lg border border-zinc-800 shadow-xl"
              />
            </div>
          ) : (
            <div className="w-72 h-72 mx-auto rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-xs text-zinc-500 animate-pulse">
              Rendering SVG from chain...
            </div>
          )}

          <TxStatus stage={stage} hash={hash} />

          <div className="flex justify-center gap-3 pt-2">
            {mintedId !== null && (
              <Link href={`/token/${mintedId.toString()}`}>
                <Button>View Token Page →</Button>
              </Link>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setStage("idle");
                setHash(null);
                setMintedId(null);
                settledHash.current = null;
              }}
            >
              Mint Another
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="space-y-4 text-center max-w-md mx-auto">
        <h2 className="text-base font-semibold text-white">Forge a Generative Piece</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Each piece is deterministically rendered from block randomness and token entropy into an SVG stored directly on-chain. Zero IPFS, zero API servers.
        </p>

        <TxStatus stage={stage} hash={hash} />

        <Button
          onClick={handleMint}
          disabled={stage === "signing" || stage === "pending"}
          className="w-full"
        >
          {stage === "signing" ? "Confirming in Wallet..." : stage === "pending" ? "Minting Piece..." : "Mint Kiln NFT (Free + Gas)"}
        </Button>
      </div>
    </Panel>
  );
}
