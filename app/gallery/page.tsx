"use client";

import { useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { NAV } from "@/lib/nav";

export default function GalleryPage() {
  const [tokenIdInput, setTokenIdInput] = useState("");

  return (
    <PageShell
      nav={NAV}
      title="Kiln Gallery"
      description="Look up generative on-chain SVG tokens by ID."
    >
      <div className="space-y-6">
        <Panel>
          <div className="space-y-4 max-w-md">
            <h2 className="text-base font-semibold text-white">Find a Token</h2>
            <p className="text-xs text-zinc-400">
              Enter any token ID to inspect its deterministic SVG artwork, seed bytes, and current owner.
            </p>

            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Token ID (e.g. 1)"
                value={tokenIdInput}
                onChange={(e) => setTokenIdInput(e.target.value)}
              />
              <Link href={tokenIdInput.trim() ? `/token/${tokenIdInput.trim()}` : "#"}>
                <Button disabled={!tokenIdInput.trim()}>View Art →</Button>
              </Link>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="space-y-3 text-xs text-zinc-400">
            <h3 className="font-semibold text-zinc-200">How Generative Kiln Works</h3>
            <p>
              • <strong>On-Chain SVGs:</strong> Kiln contracts contain their own SVG generator and Base64 encoder. Calling <code>tokenURI(tokenId)</code> constructs the entire vector graphic in Solidity without touching external APIs.
            </p>
            <p>
              • <strong>Deterministic Seed:</strong> Each piece derives its shapes, circles, palette hues, and opacity from <code>keccak256(abi.encode(tokenId, block.prevrandao))</code>.
            </p>
            <p>
              • <strong>No Off-chain Reliance:</strong> As long as BOT Chain exists, the artwork remains directly retrievable and renderable.
            </p>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
