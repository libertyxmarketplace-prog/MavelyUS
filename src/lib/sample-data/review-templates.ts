export type ReviewLine = string | { text: string; only?: RegExp; not?: RegExp; about?: string }

export type ReviewPool = {
  /** Titles for a four or a five, a three, and a one or a two. */
  titles: { high: readonly ReviewLine[]; mid: readonly ReviewLine[]; low: readonly ReviewLine[] }
  /** What a pleased buyer says. */
  praise: readonly ReviewLine[]
  /** What any buyer notices: sizes, set-up, materials, packaging. */
  detail: readonly ReviewLine[]
  /** The small complaints a satisfied buyer still mentions. */
  gripe: readonly ReviewLine[]
  /** What went wrong for a buyer who was not satisfied. */
  fault: readonly ReviewLine[]
}

const WIRELESS = /mouse|keyboard|headphones|speaker/i
const BUILT = /chair|standing desk|cabinet|whiteboard|shredder/i
const SUPPLIES = /pen|notes/i
const KITCHEN = /mug|skillet|board|baking|containers|kettle|knife/i
const TEXTILE = /towel|blanket/i
const WORN = /bag|belt|shoes/i

export const REVIEW_POOLS: Record<string, ReviewPool> = {
  Electronics: {
    titles: {
      high: ["Works with everything on my desk", "Set up in five minutes", "Solid build for the price", "Better than the one it replaced", "Does exactly what it says", "A month in and no complaints", "Quietly excellent", "Worth paying a little more"],
      mid: ["Good, with one catch", "Does the job", "Fine once it is set up", "Decent, not remarkable", "Mixed feelings"],
      low: ["Stopped working in week two", "Not what the listing suggests", "Could not rely on it", "Went back the same week", "Too flimsy for daily use"],
    },
    praise: [
      { text: "Plugged the {item} in and {they} worked straight away, with no drivers to hunt for.", not: /stand|headphones|speaker/i },
      "In use eight hours a day and {they} {has} not missed a beat.",
      "Feels far better made than the price suggests.",
      "A clear step up from the cheaper one I had before.",
      { text: "Paired with my laptop and my phone without any fuss.", only: WIRELESS },
      { text: "The picture is sharp and the colours look true.", only: /monitor|webcam/i },
      { text: "Sound is full and clear, even at low volume.", only: /headphones|speaker/i },
      { text: "Raised my screen to eye level, and my neck has thanked me since.", only: /stand/i },
      "Bought a second {item} for the office after a week with the first.",
    ],
    detail: [
      { text: "The cable is long enough to reach from the back of the desk.", not: /stand/i },
      { text: "Took one firmware update out of the box, which ran on its own.", only: /mouse|keyboard|headphones|speaker|webcam|monitor/i },
      "The finish picks up fingerprints, but a cloth sorts that out.",
      "Packed in recycled card with no plastic, which I appreciated.",
      "Slightly heavier than I expected, which keeps {them} from sliding around.",
      "The manual is short but answered the questions I had.",
    ],
    gripe: [
      { text: "The status light is brighter than it needs to be at night.", not: /stand/i },
      { text: "Pairing a second device is fiddlier than it should be.", only: WIRELESS },
      { text: "Runs a little warm after a few hours of use.", not: /stand/i },
      "The instructions skip a step that took me a while to work out.",
      "Only one colour on offer, and it shows dust.",
    ],
    fault: [
      { text: "Kept dropping the connection after nine days.", only: /mouse|keyboard|headphones|speaker|hub|webcam/i },
      { text: "One of the ports was dead on arrival.", only: /hub|strip|monitor|ssd/i },
      { text: "Made a faint buzzing noise from the first day.", not: /stand|mouse/i },
      { text: "Stopped powering on after the second week.", not: /stand/i },
      { text: "Wobbled under the weight of my laptop from day one.", only: /stand/i },
      "Nothing like the build quality the listing describes.",
    ],
  },
  Office: {
    titles: {
      high: ["Made my desk a better place to work", "Tidy, sturdy and simple", "Exactly what the office needed", { text: "Assembly was painless", only: BUILT }, "Holds up to daily use", "Good value for a team order", "Would order again"],
      mid: ["Does the job, just", "Fine for the price", "Good but not for everyone", "Almost there", "Took some getting used to"],
      low: ["Arrived damaged", "Not built for daily use", { text: "Parts missing from the box", not: /notes/i }, "Sent it back", "Disappointing quality"],
    },
    praise: [
      "Ordered the {item} for our office and the team noticed the difference within a week.",
      { text: "Assembly took twenty minutes with the tools in the box.", only: BUILT },
      { text: "Sturdy enough that I stopped thinking about {them} after the first day.", not: SUPPLIES },
      { text: "My desk has never been this tidy.", only: /organizer|tray|cabinet/i },
      { text: "Looks smarter than the price suggests next to our older furniture.", only: /chair|standing desk|cabinet|lamp|whiteboard/i },
      "Holds up to a whole team using {them} every day.",
      { text: "Writes smoothly and never skips.", only: /pen/i },
      { text: "The notes stay put on a monitor for days.", only: /notes/i },
      { text: "Adjusts in seconds, and the settings stay where I leave them.", only: /chair|standing desk|lamp/i },
      "Good value next to what our old office supplier charged.",
    ],
    detail: [
      { text: "The finish is matte, so it does not show smudges.", not: SUPPLIES },
      { text: "All the screws were labelled and bagged by step.", only: /chair|standing desk|cabinet|whiteboard/i },
      { text: "Heavier than it looks, which helps it stay put.", not: SUPPLIES },
      "The colour is a shade darker than the photos.",
      { text: "Fits under a standard desk with room to spare.", only: /cabinet|shredder|tray/i },
      { text: "Came in one box that one person can carry.", not: SUPPLIES },
      { text: "The pack is bigger than I expected, so it will last us a while.", only: SUPPLIES },
    ],
    gripe: [
      { text: "One of the bolts needed a second tighten after a week.", only: /chair|standing desk|cabinet|whiteboard/i },
      { text: "The edges could be finished more smoothly.", not: SUPPLIES },
      { text: "The instructions are drawings only, which slowed me down.", only: BUILT },
      { text: "A little louder in use than I expected.", only: /shredder|standing desk/i },
      "The packaging used more plastic than it needed.",
      "Would have liked a second colour to choose from.",
    ],
    fault: [
      { text: "Arrived with a cracked corner and a dent in the side.", not: SUPPLIES },
      { text: "Two of the holes did not line up, so it never sat level.", only: /chair|standing desk|cabinet|whiteboard/i },
      { text: "The mechanism jammed within the first month.", only: /chair|standing desk|shredder|cabinet|lamp/i },
      { text: "Ran dry far sooner than any I have bought before.", only: /pen/i },
      { text: "The adhesive gave up within an hour.", only: /notes/i },
      { text: "Missing parts, and the replacements took two weeks to arrive.", not: /notes/i },
      "Not worth the price once it was in use.",
    ],
  },
  Furniture: {
    titles: {
      high: ["Looks better than the pictures", "Solid feel at a fair price", "The room finally feels finished", "Easy to build, easy to like", "Sturdy and good looking", "Fits the space perfectly", "Better than expected"],
      mid: ["Nice, but check the size", "Good once assembled", "Fine for the money", "Pretty but not perfect", "Took two of us to build"],
      low: ["Damaged in delivery", "Not the colour shown", "Wobbly and cheap", "Did not fit together", "Returned after a week"],
    },
    praise: [
      "The {item} looks better in our home than it did in the photos.",
      "Solid, heavy and not a wobble anywhere.",
      "Two of us built it in under an hour.",
      "The finish matches our oak floor almost exactly.",
      "Guests keep asking where we found the {item}.",
      "Feels like it will last for years, not months.",
      "Just the right size for the space we had.",
    ],
    detail: [
      "Measure your doorway first; the box is large.",
      { text: "The legs come with felt pads, so the floor is safe.", only: /table|armchair|stool|ottoman|desk|stand/i },
      "The wood grain varies a little from piece to piece.",
      "Needed two people for the last step of assembly.",
      { text: "Wall fixings are included, but check they suit your walls.", only: /shelf/i },
      "The colour reads warmer in daylight than under lamps.",
    ],
    gripe: [
      "A couple of the screw caps do not quite sit flush.",
      { text: "The back panel is thinner than the rest of the piece.", only: /bookshelf|stand|console|desk/i },
      "The assembly instructions were printed very small.",
      "Took nearly two weeks to arrive.",
      "Scratches more easily than I would like.",
    ],
    fault: [
      "Arrived with a split along one panel.",
      "Leans to one side however it is assembled.",
      "The colour was nothing like the listing, far more orange.",
      "Two of the pre-drilled holes were in the wrong place.",
    ],
  },
  Apparel: {
    titles: {
      high: [{ text: "Fits true to size", not: /bag/i, about: "size" }, "My new everyday favourite", { text: "Soft, well made and fits well", not: WORN }, { text: "Held up after many washes", not: WORN }, { text: "Comfortable from the first wear", not: /bag/i }, "Great quality for the price", "Bought a second one", { text: "Carries everything I need", only: /bag/i }],
      mid: [{ text: "Runs a little small", not: /bag/i, about: "size" }, { text: "Nice fabric, odd fit", not: WORN, about: "size" }, "Good, not great", { text: "Comfortable but shrank a bit", not: WORN }, "Fine for the price"],
      low: [{ text: "Fell apart after two washes", not: WORN }, { text: "Nothing like the size chart", not: /bag/i, about: "size" }, "Colour faded fast", "Returned for a refund", { text: "Uncomfortable from day one", not: /bag/i }, { text: "Came apart within a month", only: WORN }],
    },
    praise: [
      { text: "The {item} fit{s} true to size, so order your usual.", not: /bag/i, about: "size" },
      { text: "Soft from the first wear and still soft after a dozen washes.", not: WORN },
      { text: "Warm enough for cold mornings without feeling heavy.", only: /sweater|jacket|beanie|vest/i, about: "weight" },
      "The stitching is neat and nothing has come loose.",
      { text: "I have worn the {item} almost every day since {they} arrived.", not: /bag/i },
      { text: "I have carried the {item} every day since {they} arrived.", only: /bag/i },
      { text: "The colour is exactly what the photos show.", about: "colour" },
      { text: "Comfortable enough that I forget I have {them} on.", not: /bag/i },
      { text: "Holds a laptop and a day's shopping without straining.", only: /bag/i },
    ],
    detail: [
      { text: "I am usually between sizes and the larger one was right.", not: /bag|belt/i, about: "size" },
      { text: "Wash cold and hang to dry; mine has kept its shape.", not: WORN },
      { text: "The fabric is a little heavier than I expected.", not: /belt|shoes/i, about: "weight" },
      { text: "Came folded in paper rather than plastic.", not: /belt|shoes/i },
      { text: "The colour is slightly darker in person.", about: "colour" },
      { text: "Came in a recycled box with no plastic.", only: /belt|shoes/i },
      { text: "The leather softened nicely after a week of wear.", only: /belt/i },
      { text: "The sole grips well on wet pavement.", only: /shoes/i },
    ],
    gripe: [
      { text: "Shrank a touch on the first wash.", not: WORN },
      { text: "The label scratches until you cut it out.", not: WORN },
      { text: "Pilling started after a month of wear.", not: WORN },
      { text: "Runs a half size small.", only: /shoes|socks|jacket|sweater|vest/i, about: "size" },
      { text: "The handles dig in when it is full.", only: /bag/i },
      { text: "The holes are spaced a little far apart.", only: /belt/i },
      { text: "The laces are shorter than they should be.", only: /shoes/i },
      "Took longer to arrive than the estimate said.",
    ],
    fault: [
      { text: "A seam came apart after the second wash.", not: WORN },
      { text: "The size chart was off by a full size.", not: /bag/i, about: "size" },
      { text: "The colour ran into the rest of my laundry.", not: WORN },
      { text: "Felt scratchy and uncomfortable from the first wear.", not: WORN },
      "Faded noticeably within a month.",
      { text: "A strap tore away from the seam within a month.", only: /bag/i },
      { text: "The buckle came loose within a month.", only: /belt/i },
      { text: "The sole started to peel away after a few runs.", only: /shoes/i },
    ],
  },
  Home: {
    titles: {
      high: ["Used every day since it arrived", "Well made and good looking", "Better than the expensive one", "Lovely quality", "Exactly what I hoped for", "Great gift", "Worth every cent"],
      mid: ["Nice, but needs care", "Good with a small flaw", "Fine for everyday", "Pretty but impractical", "Almost perfect"],
      low: ["Damaged on arrival", "Not as pictured", "Wore out quickly", "Went straight back", "Poor quality"],
    },
    praise: [
      "We use the {item} every day and {they} still look{s} new.",
      { text: "Heavier and better made than the ones we had before.", about: "weight" },
      { text: "Looks good on the counter, so it never goes back in the cupboard.", only: KITCHEN },
      { text: "Heats evenly with no hot spots.", only: /skillet|kettle|baking/i },
      { text: "Soft, thick and warm from the first use.", only: TEXTILE },
      { text: "Fills the room with a gentle scent within minutes.", only: /diffuser/i },
      "Bought the {item} as a gift and liked it so much I ordered another for us.",
      "Good value next to what the department stores charge.",
    ],
    detail: [
      { text: "Hand wash is best, even where the box says dishwasher safe.", only: KITCHEN },
      "Arrived double boxed with every piece wrapped.",
      "Slightly smaller than I pictured, so check the measurements.",
      "The colour is a touch warmer than the photos.",
      "Came with a short care card that is worth keeping.",
    ],
    gripe: [
      { text: "The handle gets warm faster than I would like.", only: /skillet|kettle/i },
      { text: "Sheds a little for the first few washes.", only: TEXTILE },
      "Marks more easily than I expected.",
      { text: "A little lighter than it looks in the pictures.", about: "weight" },
      "Wish it came in more colours.",
    ],
    fault: [
      { text: "One piece arrived chipped.", only: /mug|containers/i },
      { text: "The coating started flaking within a month.", only: /baking|skillet/i },
      { text: "Frayed along one edge after the first wash.", only: TEXTILE },
      { text: "Stopped working after three weeks.", only: /diffuser|kettle/i },
      { text: "Warped the first time we used it.", only: /board|baking/i },
      "Nothing like the quality shown in the photos.",
      "Showed wear within a few weeks of normal use.",
    ],
  },
  Outdoor: {
    titles: {
      high: ["Ready for the next trip", "Survived a wet weekend", { text: "Light, tough and simple", about: "weight" }, "Great for car camping", "Held up on a week-long hike", "Worth packing", "Better than my old kit"],
      mid: ["Good for fair weather", "Fine for short trips", { text: "Heavier than expected", about: "weight" }, "Decent value", "Works, with caveats"],
      low: ["Failed on the first trip", "Broke on the second outing", "Not trail ready", "Returned after one outing", "Poorly made"],
    },
    praise: [
      "Took the {item} on a four-day trip and {they} held up to everything.",
      { text: "Packs down smaller than I expected.", only: /tent|sleeping|chair|hammock|poles/i, about: "bulk" },
      { text: "Survived two nights of steady rain without a problem.", only: /tent|backpack|sleeping|hammock/i },
      { text: "Keeps drinks cold through a full day in the sun.", only: /bottle|cooler/i },
      { text: "Set up in ten minutes on my own.", only: /tent|hammock|grill|chair/i },
      { text: "Light enough that I stopped noticing {them} on the trail.", only: /poles|backpack|bottle|lantern|sleeping/i, about: "weight" },
      "Well made, with stitching and fittings that look built to last.",
      "Worth every cent for the weekends we spend outside.",
    ],
    detail: [
      { text: "Practise the set-up at home before your first trip.", only: /tent|hammock|grill/i },
      { text: "The carry bag is snug, so fold carefully.", only: /tent|sleeping|hammock|chair|poles/i },
      { text: "Heavier than the listing suggests, but sturdy.", about: "weight" },
      "The colour is brighter in person.",
      "Rinse and dry {them} fully before storing.",
    ],
    gripe: [
      { text: "The zips catch now and then.", only: /tent|backpack|sleeping/i },
      { text: "Takes two people to pack away neatly.", only: /tent|hammock/i },
      { text: "A bit bulky for backpacking.", about: "bulk" },
      { text: "The lid is stiff to open with cold hands.", only: /bottle|cooler/i },
      { text: "The instructions were not much help.", not: /bottle|poles/i },
      "Scuffs show up easily on the finish.",
    ],
    fault: [
      { text: "Leaked at the seams on the first wet night.", only: /tent|backpack|sleeping/i },
      { text: "Leaked into my bag on the first day out.", only: /bottle|cooler/i },
      { text: "A joint snapped on the second outing.", only: /poles|chair|hammock|grill|tent/i },
      { text: "Stopped holding a charge after a week.", only: /lantern/i },
      "A clasp broke off during the first trip.",
      { text: "Far heavier than advertised, so it stayed home.", about: "weight" },
    ],
  },
}

/** What a buyer who sent the product back adds, in any department. */
export const RETURN_LINES: readonly string[] = [
  "Sent {them} back within the 30 days and the refund arrived the following week.",
  "Returned {them} with the label from the box, and the refund came through quickly.",
  "The return was easy, which is the one good thing I can say.",
  "Returned for a refund, which was processed without any questions.",
]
