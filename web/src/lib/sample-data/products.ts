import { createRepository, intBetween, pick, pickWeighted, rowId, seeded, shuffle } from "./core"

/** Something we sell or stock: the catalog row both orders and inventory read. */
export type Product = {
  id: string
  sku: string
  name: string
  category: string
  /** List price in minor units — cents, not dollars. */
  priceCents: number
  stock: number
  reorderPoint: number
  supplier: string
  status: "active" | "archived"
}

const COUNT = 60

// A hand-written catalog, not a word-combinator: real product names read
// oddly when built from an adjective/noun cross product ("Standing Mug").
const CATALOG: readonly (readonly [string, string])[] = [
  ["Wireless Mouse", "Electronics"],
  ["Mechanical Keyboard", "Electronics"],
  ["USB-C Hub", "Electronics"],
  ["27-inch Monitor", "Electronics"],
  ["Noise-Cancelling Headphones", "Electronics"],
  ["Webcam HD", "Electronics"],
  ["Portable SSD 1TB", "Electronics"],
  ["Bluetooth Speaker", "Electronics"],
  ["Smart Power Strip", "Electronics"],
  ["Laptop Stand", "Electronics"],
  ["Ergonomic Office Chair", "Office"],
  ["Standing Desk", "Office"],
  ["Desk Organizer", "Office"],
  ["Whiteboard 4x6", "Office"],
  ["Sticky Notes Pack", "Office"],
  ["Ballpoint Pen Set", "Office"],
  ["Paper Shredder", "Office"],
  ["Filing Cabinet", "Office"],
  ["Desk Lamp LED", "Office"],
  ["Cable Management Tray", "Office"],
  ["Bookshelf 5-Tier", "Furniture"],
  ["Accent Armchair", "Furniture"],
  ["Coffee Table", "Furniture"],
  ["Storage Ottoman", "Furniture"],
  ["Floating Wall Shelf", "Furniture"],
  ["TV Stand", "Furniture"],
  ["Bar Stool Set", "Furniture"],
  ["Console Table", "Furniture"],
  ["Room Divider Screen", "Furniture"],
  ["Corner Desk", "Furniture"],
  ["Merino Wool Sweater", "Apparel"],
  ["Rain Jacket", "Apparel"],
  ["Cotton T-Shirt Pack", "Apparel"],
  ["Running Shoes", "Apparel"],
  ["Wool Beanie", "Apparel"],
  ["Canvas Tote Bag", "Apparel"],
  ["Leather Belt", "Apparel"],
  ["Denim Jacket", "Apparel"],
  ["Fleece Vest", "Apparel"],
  ["Ankle Socks 6-Pack", "Apparel"],
  ["Ceramic Mug Set", "Home"],
  ["Cast Iron Skillet", "Home"],
  ["Bamboo Cutting Board", "Home"],
  ["Aroma Diffuser", "Home"],
  ["Cotton Bath Towel Set", "Home"],
  ["Non-Stick Baking Sheet", "Home"],
  ["Glass Food Containers", "Home"],
  ["Throw Blanket", "Home"],
  ["Stainless Steel Kettle", "Home"],
  ["Knife Block Set", "Home"],
  ["Camping Tent 4-Person", "Outdoor"],
  ["Insulated Water Bottle", "Outdoor"],
  ["Trekking Poles", "Outdoor"],
  ["Portable Grill", "Outdoor"],
  ["Sleeping Bag", "Outdoor"],
  ["Hiking Backpack 40L", "Outdoor"],
  ["Folding Camp Chair", "Outdoor"],
  ["Solar Lantern", "Outdoor"],
  ["Cooler 30-Quart", "Outdoor"],
  ["Hammock with Stand", "Outdoor"],
]

const CATEGORY_CODE: Record<string, string> = {
  Electronics: "ELEC",
  Office: "OFFC",
  Furniture: "FURN",
  Apparel: "APRL",
  Home: "HOME",
  Outdoor: "OUTD",
}

/**
 * Hand-set list prices, keyed by name rather than drawn from a per-category
 * range — a mid-market shopper reads a charm price ($18, $329.99), never
 * arbitrary cents ($229.82). Each department keeps one ending convention
 * across every row in it: whole dollars everywhere except Home, which prints
 * .99. `entities-a.test.ts` holds both invariants plus a five-row spot check.
 */
const PRICE_CENTS: Record<string, number> = {
  // Electronics — whole dollars.
  "Wireless Mouse": 2_900,
  "Mechanical Keyboard": 8_900,
  "USB-C Hub": 3_900,
  "27-inch Monitor": 32_900,
  "Noise-Cancelling Headphones": 17_900,
  "Webcam HD": 5_900,
  "Portable SSD 1TB": 9_900,
  "Bluetooth Speaker": 6_900,
  "Smart Power Strip": 3_900,
  "Laptop Stand": 3_400,

  // Office — whole dollars.
  "Ergonomic Office Chair": 17_900,
  "Standing Desk": 54_900,
  "Desk Organizer": 1_900,
  "Whiteboard 4x6": 7_900,
  "Sticky Notes Pack": 500,
  "Ballpoint Pen Set": 1_800,
  "Paper Shredder": 5_900,
  "Filing Cabinet": 11_900,
  "Desk Lamp LED": 2_900,
  "Cable Management Tray": 1_400,

  // Furniture — whole dollars.
  "Bookshelf 5-Tier": 14_900,
  "Accent Armchair": 32_900,
  "Coffee Table": 21_900,
  "Storage Ottoman": 8_900,
  "Floating Wall Shelf": 3_900,
  "TV Stand": 18_900,
  "Bar Stool Set": 15_900,
  "Console Table": 19_900,
  "Room Divider Screen": 12_900,
  "Corner Desk": 24_900,

  // Apparel — whole dollars.
  "Merino Wool Sweater": 8_900,
  "Rain Jacket": 9_900,
  "Cotton T-Shirt Pack": 2_900,
  "Running Shoes": 7_900,
  "Wool Beanie": 1_900,
  "Canvas Tote Bag": 2_400,
  "Leather Belt": 3_400,
  "Denim Jacket": 6_900,
  "Fleece Vest": 4_900,
  "Ankle Socks 6-Pack": 1_600,

  // Home — .99 endings.
  "Ceramic Mug Set": 2_499,
  "Cast Iron Skillet": 4_499,
  "Bamboo Cutting Board": 1_999,
  "Aroma Diffuser": 2_999,
  "Cotton Bath Towel Set": 3_999,
  "Non-Stick Baking Sheet": 1_799,
  "Glass Food Containers": 2_799,
  "Throw Blanket": 3_499,
  "Stainless Steel Kettle": 2_999,
  "Knife Block Set": 5_999,

  // Outdoor — whole dollars.
  "Camping Tent 4-Person": 27_900,
  "Insulated Water Bottle": 2_700,
  "Trekking Poles": 5_900,
  "Portable Grill": 11_900,
  "Sleeping Bag": 8_900,
  "Hiking Backpack 40L": 14_900,
  "Folding Camp Chair": 3_900,
  "Solar Lantern": 1_900,
  "Cooler 30-Quart": 9_900,
  "Hammock with Stand": 11_900,
}

const SUPPLIERS = [
  "Northstar Distribution",
  "Harborline Wholesale",
  "Crestpoint Supply Co.",
  "Meridian Trading",
  "Ashgrove Imports",
  "Blackfen Logistics",
  "Silverline Vendors",
  "Cobalt Sourcing",
  "Fernwood Supply",
  "Ridgeback Distribution",
  "Amberlane Goods",
  "Thistledown Trading",
]

const STATUS_MIX: readonly (readonly [Product["status"], number])[] = [
  ["active", 0.88],
  ["archived", 0.12],
]

function generate(): Product[] {
  const rand = seeded("products")
  // The catalog is already distinct; shuffle only so id order does not
  // mirror the category grouping it was written in.
  const catalog = shuffle(rand, CATALOG).slice(0, COUNT)

  return catalog.map(([name, category], index) => {
    const status = pickWeighted(rand, STATUS_MIX)
    // A random price used to draw here. The draw stays, discarded, so every
    // field below that reads the generator next — stock, reorderPoint,
    // supplier, and the next row's status — keeps the value it had before the
    // random price became a hand-set anchor.
    rand()

    return {
      id: rowId("prd", index + 1),
      sku: `${CATEGORY_CODE[category]}-${String(index + 1).padStart(4, "0")}`,
      name,
      category,
      priceCents: PRICE_CENTS[name],
      // An archived product is no longer stocked, whatever it held before.
      stock: status === "archived" ? 0 : intBetween(rand, 0, 400),
      reorderPoint: intBetween(rand, 10, 60),
      supplier: pick(rand, SUPPLIERS),
      status,
    }
  })
}

/** The seeded catalog. The repository below owns the rows a demo mutates. */
export const PRODUCTS: Product[] = generate()

export const products = createRepository(PRODUCTS, {
  searchKeys: ["name", "sku", "supplier"],
  filterKeys: ["category", "status", "supplier"],
})
