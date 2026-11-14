import { redirect } from "next/navigation";

/** The intake used to live here; it is now the start page. Old links keep working. */
export default function AnalysePage() {
  redirect("/");
}
