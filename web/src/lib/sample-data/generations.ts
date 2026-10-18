import { REFERENCE_DATE, chance, createRepository, dateBetween, daysAgo, intBetween, pick, rowId, seeded } from "./core"

/**
 * One picture the image studio made. There is no picture: the studio draws an
 * abstract from `seed` and `palette`, so a row carries the four colours the
 * drawing is painted in rather than a URL to a file that does not exist.
 */
export type Generation = {
  id: string
  prompt: string
  negative?: string
  style: "realistic" | "digital-art" | "watercolor" | "line-art"
  ratio: "1:1" | "4:3" | "16:9" | "9:16"
  quality: "standard" | "high"
  /** The whole number the drawing is derived from; the same seed draws the same picture. */
  seed: number
  /** Four `oklch()` strings from the seed — soft, light, never saturated. */
  palette: string[]
  createdAt: Date
}

const COUNT = 16

const STYLES: readonly Generation["style"][] = ["realistic", "digital-art", "watercolor", "line-art"]
const RATIOS: readonly Generation["ratio"][] = ["1:1", "4:3", "16:9", "9:16"]

// What people actually type into an image box: a subject, a place, a light.
const PROMPTS = [
  "A quiet harbour at dawn with fishing boats and low mist over the water",
  "An isometric illustration of a small data centre with glowing racks",
  "A watercolour map of a mountain village in early autumn",
  "Line drawing of a bicycle leaning against a stone wall",
  "A minimal poster of a lighthouse on a cliff at night",
  "A cosy reading nook with a window seat and rain outside",
  "Abstract flowing shapes in soft pastel colours for a landing page hero",
  "A tram crossing a bridge in a rainy city at blue hour",
  "Botanical study of a fern frond on cream paper",
  "A desert highway at sunset with long shadows and a single car",
  "A friendly robot watering plants in a greenhouse",
  "An overhead view of a tidy desk with a notebook and a cup of coffee",
  "A paper-cut style forest with layered hills and a crescent moon",
  "A futuristic train station with tall arched windows and morning light",
  "A still life of pears and a ceramic jug in morning light",
  "A lone tent under the northern lights on a frozen lake",
]

const NEGATIVES = ["text, watermark, blurry", "people, logos", "harsh shadows", "low contrast, noise"]

/**
 * Four soft colours from a seed: analogous hues a step apart, light enough to
 * sit on a card and never saturated past the point where a tint reads as a
 * status. The image studio's art and its `generate` action both paint from
 * this, so a picture made at runtime looks like one made by the seed.
 */
export function paletteFor(seed: number): string[] {
  const rand = seeded(`generation:${seed}`)
  const base = rand() * 360
  return Array.from({ length: 4 }, (_, index) => {
    const hue = Math.floor((base + index * (22 + rand() * 18)) % 360)
    const lightness = 0.62 + rand() * 0.26
    const chroma = 0.04 + rand() * 0.08
    return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(3)} ${hue})`
  })
}

function generate(): Generation[] {
  const rand = seeded("generations")

  return PROMPTS.slice(0, COUNT).map((prompt, index) => {
    const seed = intBetween(rand, 1_000, 999_999)
    return {
      id: rowId("gen", index + 1),
      prompt,
      negative: chance(rand, 0.4) ? pick(rand, NEGATIVES) : undefined,
      // Every style meets every ratio once across the sixteen, so the gallery
      // shows each chip and each frame shape whichever way the seed falls.
      style: STYLES[index % STYLES.length],
      ratio: RATIOS[Math.floor(index / STYLES.length) % RATIOS.length],
      quality: chance(rand, 0.35) ? "high" : "standard",
      seed,
      palette: paletteFor(seed),
      createdAt: dateBetween(rand, daysAgo(21), REFERENCE_DATE),
    }
  })
}

/** The seeded gallery. The repository below owns the rows the studio adds to and removes from. */
export const GENERATIONS: Generation[] = generate()

export const generations = createRepository(GENERATIONS, {
  searchKeys: ["prompt"],
  filterKeys: ["style", "ratio", "quality"],
})
