// ═══════════════════════════════════════════════════════════
// NARRATIVE TEMPLATES — Delta-grounded story fragments
// Used by the simulation engine to produce literary events
// ═══════════════════════════════════════════════════════════

export const BRIDGE_NARRATIVES = {
    Authenticity: [
        "{a} plays a song at the juke joint that makes {b} remember who they really are",
        "{a} drops the mask at the crossroads — {b} sees them true for the first time",
        "In the lamplight of the church, {a} confesses something to {b} that changes everything",
    ],
    Empathy: [
        "{a} sits with {b} on the levee, saying nothing, understanding everything",
        "{b}'s grief breaks open and {a} catches it without flinching",
        "The sound {a} makes on that guitar puts {b}'s unspeakable loss into words",
    ],
    Complexity: [
        "{a} and {b} realize the simple story they've been told about each other is a lie",
        "At Hopson Plantation, {a} sees {b} caught between two impossible choices",
        "The system that binds {a} also binds {b} — they see the architecture for the first time",
    ],
    Reciprocity: [
        "{b} returns the favor {a} forgot they'd given — the circle closes",
        "{a} and {b} trade knowledge: one teaches reading, the other teaches the river",
        "What {a} grows, {b} sells — what {b} earns, {a} protects",
    ],
    Resilience: [
        "{a} watches {b} get knocked down for the fifth time and stand up for the sixth",
        "The water takes {a}'s house but not {a}'s will — {b} witnesses and remembers",
        "{a} rebuilds what the flood destroyed while {b} holds the lantern",
    ],
    Integrity: [
        "{a} refuses the deal at the crossroads — {b} understands why and it costs them both",
        "When the law comes for {b}, {a} doesn't lie — and doesn't betray",
        "{a} keeps the promise made to {b} even when the world makes it impossible",
    ],
    Serendipity: [
        "{a} and {b} arrive at the crossroads at midnight from opposite directions",
        "The tune {a} hums is the one {b}'s grandmother used to sing — neither knows why",
        "A wrong turn on the backroad puts {a} at {b}'s door on the one night it matters",
    ],
    Clarity: [
        "Standing on the levee at dawn, {a} tells {b} exactly what's coming and what to do",
        "{a} strips the preacher's sermon down to one sentence that hits {b} like gospel",
        "The river makes everything simple — {a} and {b} finally see the same thing",
    ],
};

export const DISSOLUTION_NARRATIVES = [
    "{char} walks north toward the Illinois Central and doesn't look back",
    "The river takes {char}'s cabin first — then {char}'s resolve",
    "{char} is last seen at the crossroads, waiting for something that already came",
    "They find {char}'s guitar but not {char} — the Sunflower keeps its secrets",
    "{char} folds into the Great Migration like a letter into an envelope",
    "The flood erases {char} from Clarksdale the way it erases everything",
];

export const EMERGENCE_NARRATIVES = [
    "{char} arrives on the Illinois Central from {origin} — carrying {detail}",
    "{char} is born in the back room of the juke joint while the blues plays on",
    "{char} steps off the levee road with a story nobody believes yet",
    "{char} emerges from the flood water like something the river wanted to say",
];

export const EMERGENCE_ORIGINS = ["Tutwiler", "Mound Bayou", "Greenville", "Vicksburg", "Helena", "Memphis"];

export const EMERGENCE_DETAILS = [
    "a Bible and a knife",
    "nothing but red dust on their boots",
    "a letter they won't show anyone",
    "a debt that followed them south",
    "seeds for a garden they'll never plant",
];
