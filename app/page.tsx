import PageShell from "@/components/layout/PageShell";
import { NAV } from "@/lib/nav";
import { app } from "@/lib/app-config";
import MintButton from "@/components/kiln/MintButton";

export default function Home() {
  return (
    <PageShell nav={NAV} title={app.name} description={app.tagline}>
      <MintButton />
    </PageShell>
  );
}
