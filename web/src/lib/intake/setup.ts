import type { Mapping } from "./fields";

export type Audience = "county-board" | "screening-unit" | "national";
export type Level = "municipality" | "county" | "national";
export type PublicDataset = "sotkanet-screening" | "registry-pathway" | "languages" | "mortality";

export type AnalysisSetup = {
  datasets: PublicDataset[];
  upload: { fileName: string; headers: string[]; rowCount: number; mapping: Mapping } | null;
  audience: Audience;
  level: Level;
  countyId: number | null;
};

export const PUBLIC_DATASETS: { id: PublicDataset; nameEn: string; source: string; description: string }[] = [
  { id: "sotkanet-screening", nameEn: "Screening participation", source: "THL Sotkanet", description: "Municipal and county participation rates in cancer screening." },
  { id: "registry-pathway", nameEn: "Screening pathway", source: "Finnish Cancer Registry", description: "Invitation, screening, referral and follow-up counts along the pathway." },
  { id: "languages", nameEn: "Language groups", source: "Statistics Finland", description: "Population by mother tongue for each area." },
  { id: "mortality", nameEn: "Cancer mortality", source: "Finnish Cancer Registry", description: "Cancer deaths by area and year." },
];
