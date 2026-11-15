import { redirect } from "next/navigation";

// next.config.ts preserves the original /staff redirect, including query parameters.
export default function StaffPage() {
  redirect("/nurse");
}
