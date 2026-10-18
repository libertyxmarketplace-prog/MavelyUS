import {
  REFERENCE_DATE,
  chance,
  createRepository,
  dateBetween,
  daysAhead,
  intBetween,
  pick,
  pickWeighted,
  rowId,
  seeded,
} from "./core"
import { ORDERS } from "./orders"

/** The four stages a parcel moves through, in the order it moves through them. */
export const SHIPMENT_STAGES = ["picking", "packing", "shipped", "delivered"] as const

export type ShipmentStageName = (typeof SHIPMENT_STAGES)[number]

/** One stage of a shipment. `at` is set once the stage has actually happened. */
export type ShipmentStage = { name: ShipmentStageName; at?: Date }

/** Something that stopped a parcel, and what the warehouse has to do about it. */
export type ShipmentException = {
  code: "address" | "customs" | "damaged" | "delayed" | "missing_label"
  message: string
  raisedAt: Date
}

/** A parcel leaving the warehouse against an order. */
export type Shipment = {
  id: string
  /** An Order id. */
  orderId: string
  /** That order's own number, so a row reads without a second lookup. */
  orderNumber: string
  carrier: string
  service: "standard" | "express" | "overnight"
  /** The tracking number the carrier issued, once the parcel is with them. */
  tracking?: string
  /** The order's destination country. */
  destination: string
  /** All four stages, always; the ones already reached carry a timestamp. */
  stages: ShipmentStage[]
  /** The stage the parcel is on now — the last one with a timestamp. */
  stage: ShipmentStageName
  weightGrams: number
  /** Only ever on a parcel that has not been delivered. */
  exception?: ShipmentException
}

const COUNT = 320

const CARRIERS: readonly (readonly [string, number])[] = [
  ["Meridian Freight", 0.34],
  ["Harbor Line", 0.26],
  ["Kestrel Courier", 0.22],
  ["Northgate Post", 0.18],
]

const SERVICE_MIX: readonly (readonly [Shipment["service"], number])[] = [
  ["standard", 0.62],
  ["express", 0.28],
  ["overnight", 0.1],
]

// How often a parcel stops moving altogether, and where it stops. A parcel is
// not stuck at random: a label that never printed and an address that will not
// resolve both bite early, and a customs hold bites once the carrier has it.
// Kept low on purpose: an unstuck parcel is delivered within a week, so the
// stuck ones pile up across the whole window and a rate that reads as modest
// per order still leaves them the majority of what is in flight.
const STUCK_RATE = 0.12

// How far back an open exception can go. Anything older than this has been
// resolved, re-sent or written off — an operations page holds the work that is
// still open, not a parcel that has been sitting at a hub since the spring.
const STUCK_WINDOW_DAYS = 28

const STUCK_AT: readonly (readonly [ShipmentStageName, number])[] = [
  ["picking", 0.18],
  ["packing", 0.3],
  ["shipped", 0.52],
]

const EXCEPTIONS: readonly ShipmentException["code"][] = [
  "address",
  "customs",
  "damaged",
  "delayed",
  "missing_label",
]

const EXCEPTION_MESSAGES: Record<ShipmentException["code"], string> = {
  address: "The street number is missing from the delivery address.",
  customs: "Held at customs pending a commercial invoice.",
  damaged: "The outer box was damaged in transit and is being repacked.",
  delayed: "Sitting at the sorting hub past its promised handover.",
  missing_label: "The carrier label failed to print and has not been reissued.",
}

// How long each stage takes, at the low and high end, in hours. Picking starts
// from the moment the order was placed.
const STAGE_HOURS: Record<ShipmentStageName, readonly [number, number]> = {
  picking: [1, 20],
  packing: [1, 10],
  shipped: [2, 30],
  delivered: [24, 120],
}

const HOUR_MS = 3_600_000

/** A tracking number in the shape a carrier hands back: four letters, nine digits. */
function trackingFor(rand: () => number, carrier: string): string {
  const prefix = carrier
    .split(" ")
    .map((word) => word.slice(0, 2).toUpperCase())
    .join("")
    .slice(0, 4)
  return `${prefix}${String(intBetween(rand, 100_000_000, 999_999_999))}`
}

function generate(): Shipment[] {
  const rand = seeded("shipments")
  // Only an order that was actually paid for leaves the warehouse; a cancelled
  // or still-pending order has no parcel behind it. Newest first and cut to
  // COUNT, so the book is the recent work an operations page is about rather
  // than a thin slice of half a year.
  const shippable = ORDERS.filter(
    (order) => order.status !== "cancelled" && order.status !== "pending"
  )
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
    .slice(0, COUNT)

  // Guards a shift in STATUS_MIX, orders' own COUNT, or the seed: `shippable`
  // sits comfortably above COUNT today, but nothing pins that margin, and
  // `shippable[index]` past its end would throw at module scope, inside the
  // shared store barrel every block imports through.
  const rows = Math.min(COUNT, shippable.length)

  return Array.from({ length: rows }, (_, index) => {
    // Walked rather than picked at random, so no two shipments share an order.
    const order = shippable[index]
    const carrier = pickWeighted(rand, CARRIERS)

    // A parcel's stage is where the clock has got to, not a draw of its own:
    // each stage takes its own span after the one before it, starting from the
    // order date, and the parcel is on the last stage whose stamp has actually
    // passed. So an order placed months ago is with the customer and only a
    // recent one is still in the warehouse — unless it is stuck, which is the
    // one thing that stops the walk early and is what an exception records.
    // Drawn for every parcel so the generator's stream does not depend on the
    // order's date, and then only allowed to bite inside the recent window.
    const unlucky = chance(rand, STUCK_RATE)
    const recent =
      order.placedAt.getTime() >= REFERENCE_DATE.getTime() - STUCK_WINDOW_DAYS * 24 * HOUR_MS
    const stuck = unlucky && recent
    const stopAt = stuck ? SHIPMENT_STAGES.indexOf(pickWeighted(rand, STUCK_AT)) : Infinity

    let at = order.placedAt
    let reached = 0
    const stages: ShipmentStage[] = SHIPMENT_STAGES.map((name, position) => {
      const [low, high] = STAGE_HOURS[name]
      const next = new Date(at.getTime() + intBetween(rand, low, high) * HOUR_MS)
      // Past the stage it stopped on, or past now: not reached, no stamp. The
      // first stage is always stamped, clamped to now, because a parcel that
      // exists at all has been picked up off the shelf.
      if (position > stopAt || (position > 0 && next.getTime() > REFERENCE_DATE.getTime())) {
        return { name }
      }
      at = next.getTime() > REFERENCE_DATE.getTime() ? REFERENCE_DATE : next
      reached = position
      return { name, at }
    })

    const stage = SHIPMENT_STAGES[reached]
    const shippedAt = stages[SHIPMENT_STAGES.indexOf("shipped")].at
    const code = pick(rand, EXCEPTIONS)
    const raisedFrom = stages[reached].at ?? order.placedAt

    return {
      id: rowId("shp", index + 1),
      orderId: order.id,
      orderNumber: order.number,
      carrier,
      service: pickWeighted(rand, SERVICE_MIX),
      // A tracking number exists once the carrier has the parcel, not before.
      ...(shippedAt ? { tracking: trackingFor(rand, carrier) } : {}),
      destination: order.country,
      stages,
      stage,
      weightGrams: intBetween(rand, 220, 8_400),
      // Only ever on a parcel that is still ours: a delivered one has no
      // problem left to record.
      ...(stuck && stage !== "delivered"
        ? {
            exception: {
              code,
              message: EXCEPTION_MESSAGES[code],
              raisedAt: dateBetween(
                rand,
                raisedFrom,
                // The exception was raised after the parcel reached the stage it
                // is stuck on, and no later than now.
                daysAhead(1, raisedFrom).getTime() > REFERENCE_DATE.getTime()
                  ? REFERENCE_DATE
                  : daysAhead(1, raisedFrom)
              ),
            },
          }
        : {}),
    }
  })
}

/** The seeded shipment book. The repository below owns the rows a demo mutates. */
export const SHIPMENTS: Shipment[] = generate()

export const shipments = createRepository(SHIPMENTS, {
  searchKeys: ["orderNumber", "tracking", "carrier"],
  filterKeys: ["stage", "carrier", "service", "destination"],
})
