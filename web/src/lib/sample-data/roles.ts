import { createRepository, intBetween, rowId, seeded } from "./core"
import { MEMBERS } from "./members"

type Verb = "read" | "write" | "delete" | "admin"

/** A named permission set members can be assigned in the workspace. */
export type Role = {
  id: string
  name: string
  description: string
  permissions: Record<string, Verb[]>
  members: number
}

const COUNT = 5

const RESOURCES = ["billing", "customers", "deployments", "integrations", "settings", "api_keys"] as const

const OWNER_PERMISSIONS: Record<string, Verb[]> = Object.fromEntries(
  RESOURCES.map((resource) => [resource, ["read", "write", "delete", "admin"]])
)

const ADMIN_PERMISSIONS: Record<string, Verb[]> = {
  billing: ["read", "write"],
  customers: ["read", "write", "delete"],
  deployments: ["read", "write", "delete"],
  integrations: ["read", "write", "delete"],
  settings: ["read", "write", "admin"],
  api_keys: ["read", "write", "delete"],
}

const MEMBER_PERMISSIONS: Record<string, Verb[]> = {
  billing: [],
  customers: ["read", "write"],
  deployments: ["read", "write"],
  integrations: ["read"],
  settings: ["read"],
  api_keys: ["read"],
}

const VIEWER_PERMISSIONS: Record<string, Verb[]> = {
  billing: [],
  customers: ["read"],
  deployments: ["read"],
  integrations: ["read"],
  settings: ["read"],
  api_keys: [],
}

const BILLING_PERMISSIONS: Record<string, Verb[]> = {
  billing: ["read", "write", "admin"],
  customers: ["read"],
  deployments: [],
  integrations: [],
  settings: [],
  api_keys: [],
}

// Four of the five roles line up 1:1 with a Member["role"] value, so their
// headcount is read straight off the team directory instead of rolled — the
// numbers on this page and the members page can never disagree. "Billing" is
// a cross-cutting role no Member field tracks, so it gets its own small draw.
const ROLE_DEFS: {
  name: string
  description: string
  permissions: Record<string, Verb[]>
  memberRole?: (typeof MEMBERS)[number]["role"]
}[] = [
  {
    name: "Owner",
    description: "Full control over billing, members, and workspace settings.",
    permissions: OWNER_PERMISSIONS,
    memberRole: "owner",
  },
  {
    name: "Admin",
    description: "Manages members, integrations, deployments, and workspace configuration.",
    permissions: ADMIN_PERMISSIONS,
    memberRole: "admin",
  },
  {
    name: "Member",
    description: "Creates and edits customers and deployments day to day.",
    permissions: MEMBER_PERMISSIONS,
    memberRole: "member",
  },
  {
    name: "Viewer",
    description: "Read-only access to dashboards, customers, and reports.",
    permissions: VIEWER_PERMISSIONS,
    memberRole: "viewer",
  },
  {
    name: "Billing",
    description: "Manages invoices and payment methods without touching the product.",
    permissions: BILLING_PERMISSIONS,
  },
]

function generate(): Role[] {
  const rand = seeded("roles")
  return ROLE_DEFS.slice(0, COUNT).map((def, index) => ({
    id: rowId("rol", index + 1),
    name: def.name,
    description: def.description,
    permissions: def.permissions,
    members: def.memberRole
      ? MEMBERS.filter((member) => member.role === def.memberRole).length
      : intBetween(rand, 2, 5),
  }))
}

/** The seeded RBAC roles. The repository below owns the rows a demo mutates. */
export const ROLES: Role[] = generate()

export const roles = createRepository(ROLES, {
  searchKeys: ["name", "description"],
  filterKeys: ["name"],
})
