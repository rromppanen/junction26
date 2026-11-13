import { getDataset } from "@/lib/data";
import { measureCsv } from "@/data/measureKit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const regionId = Number(id);
  const ds = await getDataset();
  if (!ds.regions.some((r) => r.id === regionId && r.kind === "county")) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(measureCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="gap-radar-mittarit-${regionId}.csv"`,
    },
  });
}
