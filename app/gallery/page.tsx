"use client";

import PageShell from "@/components/layout/PageShell";
import PieceGrid from "@/components/kiln/PieceGrid";
import { NAV } from "@/lib/nav";

/**
 * The gallery.
 *
 * It previously held a grid, a lookup by token number, and a panel explaining how the generator
 * works — the lookup being pointless once every piece is on screen and clickable, and the
 * explanation being the same claim the mint page already makes. What is left is the work.
 */
export default function GalleryPage() {
  return (
    <PageShell
      nav={NAV}
      title="Gallery"
      description="Every piece minted, and the ones this wallet holds. The art is on chain — this is reading it, not a copy."
    >
      <div className="space-y-5">
        <PieceGrid mineOnly />
        <PieceGrid />
      </div>
    </PageShell>
  );
}
