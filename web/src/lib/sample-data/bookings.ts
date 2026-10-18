import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAgo,
  daysAhead,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
} from "./core"
import { avatarFor } from "./avatars"

/**
 * A room in the house. Not an entity of its own: a hotel's room list is a
 * fixed inventory rather than rows that come and go, so it is a constant here
 * and a booking points at one by id.
 */
export type Room = {
  id: string
  /** The number on the door. */
  number: string
  type: "standard" | "deluxe" | "suite"
  floor: number
  beds: number
  /** The rack rate in minor units — what the room goes for before any discount. */
  rackRateCents: number
}

const FLOOR_PLAN: readonly (readonly [Room["type"], number, number, number])[] = [
  // type, rooms per floor, beds, rack rate in cents
  ["standard", 6, 1, 189_00],
  ["deluxe", 4, 2, 279_00],
  ["suite", 2, 2, 449_00],
]

/** The house: three floors of twelve, standard through suite. */
export const ROOMS: readonly Room[] = [1, 2, 3].flatMap((floor) => {
  let door = 0
  return FLOOR_PLAN.flatMap(([type, count, beds, rackRateCents]) =>
    Array.from({ length: count }, () => {
      door += 1
      const number = `${floor}${String(door).padStart(2, "0")}`
      return { id: `room-${number}`, number, type, floor, beds, rackRateCents }
    })
  )
})

/** A stay: who, which room, which nights, and what it came to. */
export type Booking = {
  id: string
  /** The reference a guest quotes at the desk. */
  reference: string
  guestName: string
  /** A face for the guest — the kit's own avatar route for the name. */
  guestAvatar: string
  /** A Room id. */
  roomId: string
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show"
  /** Midnight UTC on the arrival day. */
  checkIn: Date
  /** Midnight UTC on the departure day; the guest is not in the room that night. */
  checkOut: Date
  nights: number
  adults: number
  children: number
  /** What this stay actually pays per night, in minor units. */
  ratePerNightCents: number
  /** `nights * ratePerNightCents`, in minor units. */
  totalCents: number
  currency: "USD"
  /**
   * The channel it came through: the hotel's own desk and site, a travel
   * marketplace, a booking site, a corporate account or the door. Kinds of
   * channel, never the companies that run them.
   */
  source: "direct" | "marketplace" | "booking_site" | "corporate" | "walk_in"
  bookedAt: Date
  /**
   * The registration card the guest signed at check-in — the signature (path
   * data or a typed name, read through parseSignature before it is kept) and
   * when it was signed. A seeded booking has none.
   */
  registration?: { signature: unknown; signedAt: Date }
}

// The window the book covers, in days either side of the reference date: six
// weeks of history for last night's occupancy, six weeks of forward book for a
// month of availability.
const OPEN = -40
const CLOSE = 42

const FIRST_NAMES = [
  "Amara", "Bruno", "Cecile", "Dimitri", "Elif", "Finn", "Greta", "Hassan",
  "Ingrid", "Jonas", "Kaori", "Lucia", "Mateo", "Nadia", "Oskar", "Petra",
  "Quinn", "Rosa", "Samir", "Tanya", "Ulrich", "Vera", "Wren", "Yusuf",
]

const LAST_NAMES = [
  "Adeyemi", "Bertrand", "Castellano", "Delacroix", "Eriksen", "Fontaine",
  "Grunewald", "Hoffmann", "Ivanova", "Janssen", "Kowalski", "Lindqvist",
  "Moretti", "Nakamura", "Oyelaran", "Petrov", "Ramirez", "Sorensen",
  "Tanaka", "Ueda", "Vasquez", "Weber", "Yilmaz", "Zielinski",
]

/**
 * The nights a room sits empty between two stays: mostly none at all, which is
 * what puts occupancy in the seventies rather than at half the house.
 */
const GAP_MIX: readonly (readonly [number, number])[] = [
  [0, 0.45],
  [1, 0.3],
  [2, 0.15],
  [3, 0.1],
]

/** How long a stay runs, weighted the way a city hotel's book actually falls. */
const NIGHTS_MIX: readonly (readonly [number, number])[] = [
  [1, 0.32],
  [2, 0.28],
  [3, 0.19],
  [4, 0.11],
  [5, 0.06],
  [7, 0.04],
]

const SOURCE_MIX: readonly (readonly [Booking["source"], number])[] = [
  ["direct", 0.31],
  ["marketplace", 0.27],
  ["booking_site", 0.18],
  ["corporate", 0.15],
  ["walk_in", 0.09],
]

/** What each channel costs, as a share off the rack rate the room asks. */
const CHANNEL_DISCOUNT: Record<Booking["source"], number> = {
  direct: 0,
  marketplace: 0.15,
  booking_site: 0.17,
  corporate: 0.22,
  walk_in: 0.05,
}

/** Midnight UTC on the day `date` falls on — a night is a calendar day. */
function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

const TODAY = utcDay(REFERENCE_DATE)

const ROOM_BY_ID = new Map(ROOMS.map((room) => [room.id, room]))

/**
 * What a stay is, read off the calendar. A guest who left before today is
 * checked out; one who arrived earlier and has not left is in the house — due
 * out today included, because they are still in the room this morning; and one
 * arriving today or later is confirmed but not yet at the desk, which is what
 * makes an arrivals list something a front desk still has to work through. A
 * scattering of cancellations and no-shows sits over all of it.
 */
function statusFor(rand: () => number, checkIn: Date, checkOut: Date): Booking["status"] {
  if (chance(rand, 0.06)) return "cancelled"
  if (checkOut.getTime() < TODAY.getTime()) return chance(rand, 0.04) ? "no_show" : "checked_out"
  if (checkIn.getTime() >= TODAY.getTime()) return "confirmed"
  return "checked_in"
}

/**
 * The book, laid out room by room rather than booking by booking: each room is
 * filled from the start of the window with a stay, then a gap, then the next
 * stay, until the window runs out. Picking a room at random per booking would
 * put two guests in one room on the same night, and an in-house list that
 * names room 203 twice is not a hotel — it is a bug the picture hides.
 */
function generate(): Booking[] {
  const rand = seeded("bookings")

  const stays: { roomId: string; night: number; nights: number }[] = []
  for (const room of ROOMS) {
    // Each room opens a few days into the window, so the house does not turn
    // over all at once on the first morning.
    let night = OPEN + intBetween(rand, 0, 4)
    while (night <= CLOSE) {
      const nights = pickWeighted(rand, NIGHTS_MIX)
      stays.push({ roomId: room.id, night, nights })
      night += nights + pickWeighted(rand, GAP_MIX)
    }
  }
  // Ids run in arrival order, so bkg_0001 is the first guest through the door.
  stays.sort((a, b) => a.night - b.night || a.roomId.localeCompare(b.roomId))

  return stays.map((stay, index) => {
    const checkIn = utcDay(daysAhead(stay.night))
    const checkOut = daysAhead(stay.nights, checkIn)
    const room = ROOM_BY_ID.get(stay.roomId)!
    const source = pickWeighted(rand, SOURCE_MIX)
    const ratePerNightCents =
      Math.round((room.rackRateCents * (1 - CHANNEL_DISCOUNT[source])) / 100) * 100

    // Booked between six months out and the morning of arrival — a walk-in on
    // the day, a corporate block half a year ahead — but never later than
    // "now", because a stay still ahead of us was booked behind us.
    const bookedAt = dateBetween(
      rand,
      daysAgo(180, checkIn),
      new Date(Math.min(checkIn.getTime(), REFERENCE_DATE.getTime()))
    )

    const guestName = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`

    return {
      id: rowId("bkg", index + 1),
      reference: `NW-${String(index + 1).padStart(5, "0")}`,
      guestName,
      guestAvatar: avatarFor(guestName),
      roomId: room.id,
      status: statusFor(rand, checkIn, checkOut),
      checkIn,
      checkOut,
      nights: stay.nights,
      adults: intBetween(rand, 1, 2),
      children: chance(rand, 0.22) ? intBetween(rand, 1, 2) : 0,
      ratePerNightCents,
      totalCents: stay.nights * ratePerNightCents,
      currency: "USD" as const,
      source,
      bookedAt,
    }
  })
}

/** The seeded book. The repository below owns the rows the desk changes. */
export const BOOKINGS: Booking[] = generate()

export const bookings = createRepository(BOOKINGS, {
  searchKeys: ["guestName", "reference"],
  filterKeys: ["status", "source", "roomId"],
})
