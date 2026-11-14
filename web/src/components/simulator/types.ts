/** One county as the simulator page sees it: observed Sotkanet figures only. */
export type SimCounty = {
  id: number;
  name: string;
  /** Breast screening attendance, %, latest year (Sotkanet 3621). */
  attendance: number;
  /** Population at year end, latest year (Sotkanet 127). */
  population: number;
  /** Women aged 50–69, Statistics Finland 11re; undefined if missing. */
  women?: number;
  /** Below Finland as a whole in every year with a figure. */
  persistent: boolean;
  /** Least-squares slope over the years shown, percentage points a year. */
  trend: number | null;
};
