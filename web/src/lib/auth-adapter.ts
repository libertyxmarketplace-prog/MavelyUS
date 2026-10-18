import { isEmail } from "@/lib/validation"

export type Session = {
  user: { id: string; name: string; email: string; avatarUrl?: string }
  expiresAt: Date
}

export type AuthError = {
  code:
    | "invalid_credentials"
    | "email_taken"
    | "weak_password"
    | "invalid_code"
    | "expired_token"
    | "rate_limited"
    | "invalid_input"
    | "unknown"
  message: string
  field?: "email" | "password" | "code" | "name"
}

export type AuthResult<T = Session> = { ok: true; data: T } | { ok: false; error: AuthError }

export type AuthAdapter = {
  signIn(input: { email: string; password: string; remember?: boolean }): Promise<AuthResult>
  signUp(input: { name: string; email: string; password: string }): Promise<AuthResult>
  requestPasswordReset(input: { email: string }): Promise<AuthResult<{ sent: true }>>
  resetPassword(input: { token: string; password: string }): Promise<AuthResult<{ reset: true }>>
  verifyCode(input: { code: string }): Promise<AuthResult<{ verified: true }>>
  signOut(): Promise<void>
  getSession(): Promise<Session | null>
}

// The mock's fixed "now". Every expiry derives from this fixed point, never
// from the system clock, so the mock behaves identically in a test run today
// and a demo run a year from now.
const REFERENCE_DATE = new Date("2026-09-04T15:40:00.000Z")
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000
const MOCK_SESSION_EXPIRES_AT = new Date(REFERENCE_DATE.getTime() + SESSION_LIFETIME_MS)

function mockSessionFor(email: string): Session {
  return { user: { id: "usr_0001", name: "Ada Lovelace", email }, expiresAt: MOCK_SESSION_EXPIRES_AT }
}

// Private to this module: the mock's "signed in" state. Process-local and
// cleared by signOut, the same in-memory-mutation contract as sample-data.
let mockSession: Session | null = null

/**
 * Deterministic and in-memory: `taken@example.com` is always already
 * registered, the password "wrong" is always rejected, the code "000000" is
 * always invalid, and everything else succeeds. A signed-in session lives in
 * module state until `signOut` clears it — good enough for demos and dev,
 * not for anything that outlives the process.
 */
export const mockAuthAdapter: AuthAdapter = {
  async signIn({ email, password }) {
    if (password === "wrong") {
      return {
        ok: false,
        error: { code: "invalid_credentials", field: "password", message: "Incorrect email or password." },
      }
    }
    mockSession = mockSessionFor(email)
    return { ok: true, data: mockSession }
  },

  async signUp({ email }) {
    if (email === "taken@example.com") {
      return {
        ok: false,
        error: { code: "email_taken", field: "email", message: "An account with this email already exists." },
      }
    }
    mockSession = mockSessionFor(email)
    return { ok: true, data: mockSession }
  },

  async requestPasswordReset() {
    // Always succeeds and never reveals whether the email is registered.
    return { ok: true, data: { sent: true } }
  },

  async resetPassword() {
    return { ok: true, data: { reset: true } }
  },

  async verifyCode({ code }) {
    if (code === "000000") {
      return {
        ok: false,
        error: { code: "invalid_code", field: "code", message: "That code is invalid or has expired." },
      }
    }
    return { ok: true, data: { verified: true } }
  },

  async signOut() {
    mockSession = null
  },

  async getSession() {
    return mockSession
  },
}

function fieldValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

/**
 * Whether a form action was handed a form. A server action's id is in the
 * client bundle, so a crafted call can send it anything — and `get` on a
 * string, a number or nothing throws, a 500 with a stack in the server's log,
 * where a refusal belongs. Every action below checks it first; a block's own
 * form action does the same before it reads a field.
 */
export function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData
}

/** The refusal for an action handed something other than a form. */
export const NOT_A_FORM: AuthError = { code: "invalid_input", message: "Send the form as the page sends it." }

/** `action`, refusing anything that is not a form before it reads a field. */
function formOnly<T>(action: (formData: FormData) => Promise<AuthResult<T>>): (formData: FormData) => Promise<AuthResult<T>> {
  return async (formData) => (isFormData(formData) ? action(formData) : { ok: false, error: NOT_A_FORM })
}

// invalid_input covers a field that fails a plain format/required check
// before the adapter is ever called — as opposed to the adapter-level codes
// (email_taken, invalid_credentials, ...), which describe an outcome against
// stored data. `field` is what actually routes the message to the right input.
function emailError(email: string): AuthError | null {
  if (isEmail(email)) return null
  return { code: "invalid_input", field: "email", message: "Enter a valid email address." }
}

function passwordError(password: string): AuthError | null {
  if (password.length >= 8) return null
  return { code: "weak_password", field: "password", message: "Password must be at least 8 characters." }
}

function codeError(code: string): AuthError | null {
  if (/^\d{6}$/.test(code)) return null
  return { code: "invalid_code", field: "code", message: "Enter the 6-digit code." }
}

function nameError(name: string): AuthError | null {
  if (name.trim().length > 0) return null
  return { code: "invalid_input", field: "name", message: "Enter your name." }
}

/**
 * Turns FormData into a validated `AuthAdapter` call, so a block can pass one
 * of these straight to `<form action>` or call it from a client submit
 * handler. Each action reads the fields it needs (email, password, name,
 * code, token, remember), validates them, and only calls the adapter once
 * every check passes — a failing check returns its `AuthError` untouched by
 * the adapter. Sign-in does not re-validate password strength: that guards
 * the password being *set* (sign-up, reset), not one already on file.
 */
export function createAuthActions(adapter: AuthAdapter): {
  signIn: (formData: FormData) => Promise<AuthResult>
  signUp: (formData: FormData) => Promise<AuthResult>
  requestPasswordReset: (formData: FormData) => Promise<AuthResult<{ sent: true }>>
  resetPassword: (formData: FormData) => Promise<AuthResult<{ reset: true }>>
  verifyCode: (formData: FormData) => Promise<AuthResult<{ verified: true }>>
} {
  return {
    signIn: formOnly(async (formData) => {
      const email = fieldValue(formData, "email")
      const password = fieldValue(formData, "password")
      const rememberValue = formData.get("remember")
      const remember = rememberValue !== null && rememberValue !== "false"

      const invalidEmail = emailError(email)
      if (invalidEmail) return { ok: false, error: invalidEmail }

      return adapter.signIn({ email, password, remember })
    }),

    signUp: formOnly(async (formData) => {
      const name = fieldValue(formData, "name")
      const email = fieldValue(formData, "email")
      const password = fieldValue(formData, "password")

      const invalidName = nameError(name)
      if (invalidName) return { ok: false, error: invalidName }

      const invalidEmail = emailError(email)
      if (invalidEmail) return { ok: false, error: invalidEmail }

      const invalidPassword = passwordError(password)
      if (invalidPassword) return { ok: false, error: invalidPassword }

      return adapter.signUp({ name, email, password })
    }),

    requestPasswordReset: formOnly(async (formData) => {
      const email = fieldValue(formData, "email")

      const invalidEmail = emailError(email)
      if (invalidEmail) return { ok: false, error: invalidEmail }

      return adapter.requestPasswordReset({ email })
    }),

    resetPassword: formOnly(async (formData) => {
      const token = fieldValue(formData, "token")
      const password = fieldValue(formData, "password")

      const invalidPassword = passwordError(password)
      if (invalidPassword) return { ok: false, error: invalidPassword }

      return adapter.resetPassword({ token, password })
    }),

    verifyCode: formOnly(async (formData) => {
      const code = fieldValue(formData, "code")

      const invalidCode = codeError(code)
      if (invalidCode) return { ok: false, error: invalidCode }

      return adapter.verifyCode({ code })
    }),
  }
}
