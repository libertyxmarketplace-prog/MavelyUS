import { invitations } from "./invitations"
import { members } from "./members"
import { plans, type Plan } from "./plans"

/** The plan the sample workspace — Northwind Analytics — is on. */
export const WORKSPACE_PLAN = "Team"

export type SeatUsage = {
  /** The plan the seats are counted against. */
  plan: Plan
  /** Members holding a seat: in the workspace, or invited and yet to join — everyone but the deactivated. */
  members: number
  /** Invitations still open; each holds the seat it offers until it is accepted, revoked or lapses. */
  invitations: number
  /** Seats held: `members` plus `invitations`. */
  used: number
  /** The seats the plan includes, or null for a plan whose features say "Unlimited seats". */
  limit: number | null
}

/**
 * How many of the workspace's seats are held, and how many its plan includes.
 * An open invitation holds a seat, as a member does who is in or yet to join;
 * a deactivated member holds none. Read per call, never held: sending or
 * revoking an invitation moves the count.
 */
export function seatUsage(): SeatUsage {
  const plan = plans.all().find((entry) => entry.name === WORKSPACE_PLAN)
  if (!plan) throw new Error(`the workspace is on the ${WORKSPACE_PLAN} plan, which db.plans does not have`)
  const holding = members.all().filter((member) => member.status !== "deactivated").length
  const open = invitations.all().filter((invitation) => invitation.status === "pending").length
  const unlimited = plan.features.some((feature) => /^unlimited seats$/i.test(feature.trim()))
  return { plan, members: holding, invitations: open, used: holding + open, limit: unlimited ? null : plan.seatsIncluded }
}
