import type { Metadata } from "next";
import { InviteBoard } from "@/components/invite/InviteBoard";

export const metadata: Metadata = { title: "Screening round board" };

export default async function InviteBoardPage({ searchParams }: { searchParams: Promise<{ embed?: string }> }) {
  const sp = await searchParams;
  return <InviteBoard embed={sp.embed === "1"} />;
}
