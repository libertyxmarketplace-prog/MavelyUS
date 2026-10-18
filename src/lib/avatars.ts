export const AVATAR_ROUTE = "/avatars"

/** `Aisha Adeyemi` → `aisha-adeyemi`: the seed, and the file name, of the face. */
export function avatarSeed(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** The URL of the face for a name. */
export function avatarFor(name: string): string {
  return `${AVATAR_ROUTE}/${avatarSeed(name)}.svg`
}
