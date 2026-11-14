import type { Metadata } from "next";
import { KitApp } from "@/components/kit/KitApp";

export const metadata: Metadata = { title: "Läpi: home sample" };

export default function KitPage() {
  return <KitApp />;
}
