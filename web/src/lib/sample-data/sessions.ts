import { REFERENCE_DATE, chance, createRepository, rowId, seeded } from "./core"

/**
 * One hour of traffic from one country: how many sessions it sent, how slow the
 * slowest twentieth of them were, and how many failed — plus where the country
 * sits, so a map can put a marker on it.
 */
export type Session = {
  id: string
  country: string
  region: "Americas" | "EMEA" | "APAC"
  /** Sessions opened during this hour. */
  sessions: number
  /** The 95th percentile response time for the hour, in milliseconds. */
  p95Ms: number
  /** The share of requests that failed, 0..1. */
  errorRate: number
  lat: number
  lng: number
  /** The hour this reading covers, on the hour, ending at REFERENCE_DATE. */
  at: Date
}

/** How many hourly readings each country carries. */
const HOURS = 24

const HOUR_MS = 3_600_000

type Place = {
  country: string
  region: Session["region"]
  lat: number
  lng: number
  /** Relative traffic weight; the busiest country is 100. */
  weight: number
}

// Real countries at their own centroids, so a marker lands on the land it names.
const PLACES: readonly Place[] = [
  { country: "United States", region: "Americas", lat: 37.09, lng: -95.71, weight: 100 },
  { country: "Canada", region: "Americas", lat: 56.13, lng: -106.35, weight: 22 },
  { country: "Mexico", region: "Americas", lat: 23.63, lng: -102.55, weight: 17 },
  { country: "Brazil", region: "Americas", lat: -14.24, lng: -51.93, weight: 29 },
  { country: "Colombia", region: "Americas", lat: 4.57, lng: -74.3, weight: 9 },
  { country: "Chile", region: "Americas", lat: -35.68, lng: -71.54, weight: 7 },
  { country: "Argentina", region: "Americas", lat: -38.42, lng: -63.62, weight: 11 },
  { country: "United Kingdom", region: "EMEA", lat: 55.38, lng: -3.44, weight: 41 },
  { country: "Ireland", region: "EMEA", lat: 53.14, lng: -7.69, weight: 8 },
  { country: "France", region: "EMEA", lat: 46.23, lng: 2.21, weight: 26 },
  { country: "Germany", region: "EMEA", lat: 51.17, lng: 10.45, weight: 34 },
  { country: "Netherlands", region: "EMEA", lat: 52.13, lng: 5.29, weight: 13 },
  { country: "Spain", region: "EMEA", lat: 40.46, lng: -3.75, weight: 16 },
  { country: "Italy", region: "EMEA", lat: 41.87, lng: 12.57, weight: 14 },
  { country: "Poland", region: "EMEA", lat: 51.92, lng: 19.15, weight: 11 },
  { country: "Sweden", region: "EMEA", lat: 60.13, lng: 18.64, weight: 9 },
  { country: "Portugal", region: "EMEA", lat: 39.4, lng: -8.22, weight: 6 },
  { country: "Nigeria", region: "EMEA", lat: 9.08, lng: 8.68, weight: 7 },
  { country: "Kenya", region: "EMEA", lat: -0.02, lng: 37.91, weight: 4 },
  { country: "South Africa", region: "EMEA", lat: -30.56, lng: 22.94, weight: 8 },
  { country: "United Arab Emirates", region: "EMEA", lat: 23.42, lng: 53.85, weight: 9 },
  { country: "India", region: "APAC", lat: 20.59, lng: 78.96, weight: 37 },
  { country: "Singapore", region: "APAC", lat: 1.35, lng: 103.82, weight: 12 },
  { country: "Indonesia", region: "APAC", lat: -0.79, lng: 113.92, weight: 11 },
  { country: "Philippines", region: "APAC", lat: 12.88, lng: 121.77, weight: 8 },
  { country: "South Korea", region: "APAC", lat: 35.91, lng: 127.77, weight: 14 },
  { country: "Japan", region: "APAC", lat: 36.2, lng: 138.25, weight: 27 },
  { country: "Australia", region: "APAC", lat: -25.27, lng: 133.78, weight: 20 },
  { country: "Thailand", region: "APAC", lat: 15.87, lng: 100.99, weight: 9 },
]

/** Sessions at the busiest hour of the busiest country. */
const PEAK = 9

/** What each region's stack answers in, before load and jitter. */
const BASE_P95: Record<Session["region"], number> = { Americas: 210, EMEA: 260, APAC: 330 }

/** The hour a country's own afternoon peaks, in local time. */
const PEAK_HOUR = 15

/**
 * How busy a country is at a given UTC hour, 0.05 at its own small hours and 1
 * at its own afternoon. Longitude stands in for the time zone — a degree is
 * four minutes — which is what keeps Tokyo and Chicago from rushing together.
 */
function diurnal(utcHour: number, lng: number): number {
  const local = (((utcHour + lng / 15) % 24) + 24) % 24
  const phase = (2 * Math.PI * (local - PEAK_HOUR)) / 24
  return 0.05 + 0.95 * ((1 + Math.cos(phase)) / 2)
}

/** Midnight-aligned to the hour, so every reading covers a whole clock hour. */
function hourStart(hoursAgo: number): Date {
  const at = new Date(REFERENCE_DATE)
  at.setUTCMinutes(0, 0, 0)
  return new Date(at.getTime() - hoursAgo * HOUR_MS)
}

function generate(): Session[] {
  const rand = seeded("sessions")
  const rows: Session[] = []

  for (const place of PLACES) {
    for (let back = HOURS - 1; back >= 0; back--) {
      const at = hourStart(back)
      const load = diurnal(at.getUTCHours(), place.lng)
      const sessions = Math.max(
        1,
        Math.round(place.weight * PEAK * load * (0.85 + rand() * 0.3))
      )
      // Latency follows the load rather than floating free: a busy hour is a
      // slow hour, which is the whole reason a live page plots both.
      const p95Ms = Math.round(
        BASE_P95[place.region] * (0.85 + rand() * 0.35) + sessions * 0.06
      )
      // Most hours are quiet; one in twenty carries a spike, which is what
      // gives an error-rate panel something to be about.
      const errorRate = 0.002 + rand() * 0.011 + (chance(rand, 0.05) ? rand() * 0.06 : 0)

      rows.push({
        id: rowId("ses", rows.length + 1),
        country: place.country,
        region: place.region,
        sessions,
        p95Ms,
        errorRate: Math.round(errorRate * 10_000) / 10_000,
        lat: place.lat,
        lng: place.lng,
        at,
      })
    }
  }

  return rows
}

/** The seeded hourly traffic. The repository below owns the rows a demo mutates. */
export const SESSIONS: Session[] = generate()

export const sessions = createRepository(SESSIONS, {
  searchKeys: ["country", "region"],
  filterKeys: ["country", "region"],
})
