import { getDataset } from "@/lib/data";
import { publicTable } from "@/lib/publicTable";

/** The public datasets as a table for the gap engine (see lib/publicTable.ts). */
export async function GET() {
  const ds = await getDataset();
  return Response.json(publicTable(ds.regions.filter((r) => r.kind === "county")));
}
