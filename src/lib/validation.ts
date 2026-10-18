const MAX_EMAIL_LENGTH = 254

/** Any whitespace a regular expression's `\s` matches, spaces and line breaks included. */
const WHITESPACE = /\s/

/**
 * Whether a string is shaped like an email address: something, an @,
 * something, a dot, and an ending of two or more — with no spaces, one @ and
 * no more than 254 characters.
 *
 * It is a form's first check, the one that catches a slip before anything is
 * sent, not proof the address exists: only a message that arrives proves
 * that. Trim what the reader typed before asking, since a space is refused.
 *
 * Every step is one pass over the string, and a string longer than any address
 * is refused before anything scans it, so what a reader pastes — 40 KB of it —
 * costs no more than a real address does. (The pattern this replaces let the
 * two halves of the domain share its dots, and took seconds on such a string.)
 */
export function isEmail(value: string): boolean {
  if (value.length > MAX_EMAIL_LENGTH) return false
  if (WHITESPACE.test(value)) return false

  // Exactly one @, with something before it.
  const at = value.indexOf("@")
  if (at < 1 || value.indexOf("@", at + 1) !== -1) return false

  // A dot in the domain with something before it and two or more after it;
  // the first dot past the domain's first character leaves the longest ending.
  const domain = value.slice(at + 1)
  const dot = domain.indexOf(".", 1)
  return dot !== -1 && domain.length - dot - 1 >= 2
}
