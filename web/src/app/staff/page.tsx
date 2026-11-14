import type { Metadata } from "next";
import { SampleBoard } from "@/components/staff/SampleBoard";

export const metadata: Metadata = { title: "Nurse board · Läpi" };

export default function StaffPage() {
  return <SampleBoard />;
}
