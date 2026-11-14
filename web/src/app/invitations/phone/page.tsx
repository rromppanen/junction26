import type { Metadata } from "next";
import { InviteApp } from "@/components/invite/InviteApp";

export const metadata: Metadata = { title: "Screening invitation" };

export default function InvitePhonePage() {
  return <InviteApp />;
}
