import type { Metadata } from "next";
import { ArrowLeft, FlaskConical, MonitorSmartphone } from "lucide-react";
import { getDataset } from "@/lib/data";
import { CONTEXT_INDICATORS, indicatorBySlug } from "@/data/indicators";
import { latestYear } from "@/lib/gap";
import { AppHeader, HeaderLink } from "@/components/ui";
import { DataBadge } from "@/components/DataBadge";
import { shortName } from "@/components/format";
import { InvitationDesigner, type InviteCounty } from "@/components/invitation/InvitationDesigner";
import WOMEN from "@/data/women5069.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Invitation designer" };

export default async function InvitationsPage({ searchParams }: { searchParams: Promise<{ county?: string }> }) {
  const sp = await searchParams;
  const ds = await getDataset();
  const ind = indicatorBySlug("breast-screening")!;
  const fbInd = CONTEXT_INDICATORS.find((c) => c.slug === "foreign-background")!;
  const year = latestYear(ds, ind);

  const latestUpTo = (indicatorId: number, regionId: number) =>
    ds.values
      .filter((v) => v.indicatorId === indicatorId && v.regionId === regionId && v.year <= year)
      .sort((a, b) => b.year - a.year)[0]?.value ?? null;

  const women = WOMEN.counties as Record<string, number>;
  const counties: InviteCounty[] = ds.regions
    .filter((r) => r.kind === "county")
    .flatMap((r) => {
      const attendance = ds.values.find((v) => v.indicatorId === ind.id && v.regionId === r.id && v.year === year)?.value;
      const w = women[String(r.id)];
      if (attendance == null || !w) return [];
      return [{ id: r.id, name: shortName(r.name), attendance, women: w, foreignPer1000: latestUpTo(fbInd.id, r.id) }];
    })
    .sort((a, b) => a.attendance - b.attendance);

  const national = ds.regions.find((r) => r.kind === "national");
  const nationalForeign = national ? latestUpTo(fbInd.id, national.id) : null;
  const req = Number(sp.county);
  const initialCounty = counties.some((c) => c.id === req) ? req : counties[0].id;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6">
      <AppHeader>
        <HeaderLink href="/" icon={ArrowLeft} label="Home" />
        <HeaderLink href={`/simulator?county=${initialCounty}`} icon={FlaskConical} label="Screening simulator" />
        <HeaderLink href="/invitations/live" icon={MonitorSmartphone} label="See it in use" title="The woman's phone and the screening unit's board, side by side" />
        <DataBadge ds={ds} />
      </AppHeader>
      <InvitationDesigner
        counties={counties}
        nationalWomen={WOMEN.total}
        nationalForeignPer1000={nationalForeign}
        year={year}
        initialCounty={initialCounty}
      />
    </main>
  );
}
