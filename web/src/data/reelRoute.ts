import type { LngLat } from "@/lib/kit/route";
import { hubNear } from "@/lib/kit/route";

/**
 * Data for the demo reel (/reel): the robot's trip to Hybridiarena Hype in Kivenlahti, Espoo, where
 * the team is during Junction, and the rest of the fleet for the map overview.
 * Coordinates are [longitude, latitude]; map data © OpenStreetMap contributors.
 */

/** Hybridiarena Hype, Vanha Jorvaksentie 5, Espoo (the building's point in OpenStreetMap). */
export const HYPE: LngLat = [24.63066, 60.156924];

/** The sample hub the robot leaves from, placed the way the phone app places one (hubNear). */
export const HYPE_HUB: LngLat = hubNear(HYPE);

/**
 * A real walking route from that hub to the arena, 928 m. Fetched once from the Valhalla pedestrian
 * router (valhalla1.openstreetmap.de) on 14 Nov 2026 and stored here, so the reel needs no routing service.
 */
export const HYPE_ROUTE: LngLat[] = [
  [24.638659, 60.161927], [24.638557, 60.161918], [24.638527, 60.161883], [24.638251, 60.161679], [24.637964, 60.161504],
  [24.637507, 60.161207], [24.636987, 60.160942], [24.636507, 60.160701], [24.636298, 60.160634], [24.636184, 60.160611],
  [24.636198, 60.160529], [24.636281, 60.160442], [24.636466, 60.16027], [24.636694, 60.160054], [24.63677, 60.159975],
  [24.636947, 60.159796], [24.637023, 60.159706], [24.637019, 60.159618], [24.636985, 60.15953], [24.636897, 60.159449],
  [24.636789, 60.159425], [24.636693, 60.159406], [24.636543, 60.159374], [24.636693, 60.159213], [24.63677, 60.159133],
  [24.636852, 60.159071], [24.636815, 60.159063], [24.636031, 60.158895], [24.634817, 60.158639], [24.633212, 60.158301],
  [24.632799, 60.15821], [24.632679, 60.158177], [24.6326, 60.158141], [24.632572, 60.158114], [24.632557, 60.15809],
  [24.632559, 60.158061], [24.632585, 60.15801], [24.632632, 60.157916], [24.63262, 60.157858], [24.632578, 60.157784],
  [24.632515, 60.157676], [24.632343, 60.157488], [24.63227, 60.157384], [24.632214, 60.157234], [24.632154, 60.157068],
  [24.632106, 60.156989], [24.63206, 60.156912], [24.631985, 60.156785], [24.631796, 60.15679], [24.631718, 60.156555],
  [24.631662, 60.156498], [24.631589, 60.156477], [24.631488, 60.156466], [24.631436, 60.156467], [24.630538, 60.156537],
];

/** Robot hubs around the capital region, the same as the nurse app's fleet (nurse/src/lib/robots/fleet.ts). */
export const FLEET_HUBS: Record<string, LngLat> = {
  meilahti: [24.906, 60.19],
  itakeskus: [25.085, 60.2115],
  malmi: [24.993, 60.259],
  tikkurila: [25.04, 60.2935],
  myyrmaki: [24.85, 60.26],
  matinkyla: [24.74, 60.161],
  kivenlahti: HYPE_HUB,
};

/** Other robots out on pickups: from a hub towards a neighbourhood (the nurse app's areas), and how far along. */
export const FLEET_TRIPS: { hub: keyof typeof FLEET_HUBS; to: LngLat; at: number }[] = [
  { hub: "meilahti", to: [24.9497, 60.1841], at: 0.55 },   // Kallio
  { hub: "itakeskus", to: [25.083, 60.236], at: 0.4 },     // Kontula
  { hub: "malmi", to: [25.014, 60.2393], at: 0.7 },        // Pihlajamäki
  { hub: "matinkyla", to: [24.658, 60.148], at: 0.45 },    // Espoonlahti
  { hub: "tikkurila", to: [25.108, 60.2778], at: 0.6 },    // Hakunila
  { hub: "myyrmaki", to: [24.813, 60.219], at: 0.5 },      // Leppävaara
  { hub: "meilahti", to: [24.88, 60.16], at: 0.35 },       // Lauttasaari
  { hub: "itakeskus", to: [25.141, 60.2096], at: 0.65 },   // Vuosaari
  { hub: "matinkyla", to: [24.656, 60.205], at: 0.5 },     // Espoon keskus
  { hub: "malmi", to: [25.076, 60.261], at: 0.45 },        // Jakomäki
  { hub: "meilahti", to: [24.933, 60.199], at: 0.75 },     // Pasila
  { hub: "tikkurila", to: [25.06, 60.3217], at: 0.4 },     // Koivukylä
  { hub: "myyrmaki", to: [24.878, 60.2398], at: 0.6 },     // Kannelmäki
  { hub: "itakeskus", to: [25.03, 60.195], at: 0.5 },      // Herttoniemi
  { hub: "matinkyla", to: [24.805, 60.176], at: 0.55 },    // Tapiola
  { hub: "malmi", to: [24.964, 60.229], at: 0.35 },        // Oulunkylä
  { hub: "meilahti", to: [24.876, 60.199], at: 0.6 },      // Munkkiniemi
  { hub: "itakeskus", to: [25.045, 60.172], at: 0.45 },    // Laajasalo
  { hub: "myyrmaki", to: [24.844, 60.315], at: 0.4 },      // Kivistö
  { hub: "tikkurila", to: [25.077, 60.351], at: 0.3 },     // Korso
  { hub: "matinkyla", to: [24.737, 60.177], at: 0.7 },     // Olari
  { hub: "kivenlahti", to: [24.636, 60.153], at: 0.5 },    // Kivenlahti
  { hub: "malmi", to: [25.03, 60.264], at: 0.6 },          // Tapanila
  { hub: "itakeskus", to: [25.108, 60.238], at: 0.55 },    // Mellunmäki
  { hub: "meilahti", to: [24.962, 60.1872], at: 0.4 },     // Sörnäinen
  { hub: "myyrmaki", to: [24.861, 60.248], at: 0.65 },     // Malminkartano
  { hub: "itakeskus", to: [25.053, 60.198], at: 0.6 },     // Roihuvuori
  { hub: "kivenlahti", to: [24.61, 60.165], at: 0.4 },     // Espoonlahti, west
];
