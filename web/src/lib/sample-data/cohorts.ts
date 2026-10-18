import { REFERENCE_DATE, createRepository, intBetween, rowId, seeded } from "./core"

/**
 * One week's signups, followed week by week. `retention[w]` is the share of the
 * cohort still active `w` weeks after it arrived, so `retention[0]` is always 1
 * and the array is only as long as the cohort has lived — a week it has not
 * reached yet is absent rather than reported as a loss.
 */
export type Cohort = {
  id: string
  /** Midnight UTC on the Monday the cohort signed up. */
  week: Date
  /** How many accounts opened that week. */
  size: number
  /** Weeks 0 through 8, each a share of `size` in (0, 1]. */
  retention: number[]
}

/** How many weekly cohorts are followed, and how far each one is followed. */
const COHORT_COUNT = 12
const MAX_WEEK = 8

const DAY_MS = 86_400_000

/** Midnight UTC on the Monday of the week `weeksAgo` before REFERENCE_DATE. */
function weekStart(weeksAgo: number): Date {
  const day = Date.UTC(
    REFERENCE_DATE.getUTCFullYear(),
    REFERENCE_DATE.getUTCMonth(),
    REFERENCE_DATE.getUTCDate()
  )
  // getUTCDay is Sunday-based; this shifts it so Monday is 0.
  const sinceMonday = (REFERENCE_DATE.getUTCDay() + 6) % 7
  return new Date(day - (sinceMonday + weeksAgo * 7) * DAY_MS)
}

/**
 * The share still active one week on from `held`. Churn is front-loaded — the
 * accounts that were never going to stay leave first — so the weekly keep rate
 * climbs from about two thirds in week one towards nine tenths by week eight.
 */
function keepRate(rand: () => number, week: number): number {
  const settled = Math.min(1, (week - 1) / (MAX_WEEK - 1))
  return 0.62 + settled * 0.28 + rand() * 0.06
}

function generate(): Cohort[] {
  const rand = seeded("cohorts")

  return Array.from({ length: COHORT_COUNT }, (_, index) => {
    const weeksAgo = COHORT_COUNT - 1 - index
    // A cohort can only be followed as far as the calendar has taken it.
    const followed = Math.min(weeksAgo, MAX_WEEK)
    const size = intBetween(rand, 120, 460) + index * 8

    const retention = [1]
    for (let week = 1; week <= followed; week++) {
      retention.push(Math.round(retention[week - 1] * keepRate(rand, week) * 10_000) / 10_000)
    }

    return {
      id: rowId("coh", index + 1),
      week: weekStart(weeksAgo),
      size,
      retention,
    }
  })
}

/** The seeded weekly cohorts, oldest first. */
export const COHORTS: Cohort[] = generate()

export const cohorts = createRepository(COHORTS, { searchKeys: [], filterKeys: [] })
