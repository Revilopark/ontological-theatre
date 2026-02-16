// ═══════════════════════════════════════════════════════════
// MISSISSIPPI_IS — The constants that connect every era
// The river, the soil, the heat, the collision, the transmutation
// These are not themes. They are physics.
// ═══════════════════════════════════════════════════════════

export const MISSISSIPPI_IS = [
    {
        id: "the_river",
        name: "The River",
        desc: "The Mississippi has no memory but it has habits, and habits are older than memory",
        detail: "Three thousand miles of continental drainage finding its way to the Gulf — reshaping, rerouting, flooding, fertilizing. Every culture that touched this water learned the same lesson: you don't control the river. You negotiate with it.",
        clusters: ["stc", "tid", "mas", "clf"],
        color: "#4A5D23",
    },
    {
        id: "the_soil",
        name: "The Alluvial Soil",
        desc: "A hundred feet of sediment deposited by ten thousand floods — the richest topsoil on earth",
        detail: "This soil grew cotton that built fortunes, catfish that fed generations, and art that changed the world. Every culture planted something in it. Every culture was shaped by what grew. The mound builder's clay and Faulkner's sentences come from the same material.",
        clusters: ["grd", "phs", "mas", "pra"],
        color: "#7B6B4A",
    },
    {
        id: "the_heat",
        name: "The Heat",
        desc: "Subtropical weight that slows time and thickens thought — nothing happens fast but everything ferments",
        detail: "The Delta heat is not climate, it's dramaturgy. Tennessee Williams understood this: desire, violence, and beauty all move slower in the heat, and slower means more deliberate, more inevitable, more theatrical. The heat is why Mississippi stories have gravity.",
        clusters: ["tid", "ems", "som", "phs"],
        color: "#C17817",
    },
    {
        id: "the_collision",
        name: "The Collision of Peoples",
        desc: "Indigenous, African, European, and their infinite intersections — no purity, only mixture",
        detail: "Every era added another culture to the soil. The Choctaw language names the rivers. African rhythms structure the music. European instruments carry both. The collision is violent and creative in equal measure — that's the ontological engine, the -ity and -pathy in constant friction.",
        clusters: ["diu", "sod", "inc", "ced"],
        color: "#C0392B",
    },
    {
        id: "the_transmutation",
        name: "Suffering → Art",
        desc: "The defining alchemy of Mississippi — every form of suffering produces a form of art",
        detail: "Field hollers from slavery. Blues from sharecropping. Gospel from oppression. Soul from the Movement. Literature from the weight of history. Folk art from isolation. This is not metaphor — it is the primary chemical reaction of the Delta. Suffering is the input. Art is the output. The soil is the catalyst.",
        clusters: ["ccc", "bea", "ems", "clf"],
        color: "#D4A04A",
    },
];

// ═══════════════════════════════════════════════════════════
// CREATIVE OUTPUT — The prolific harvest of Mississippi soil
// Per square mile, more world-changing art than anywhere
// ═══════════════════════════════════════════════════════════

export const CREATIVE_FIGURES = [
    // ── Music: The Blues and Everything It Became ──
    {
        category: "music",
        figures: [
            {
                name: "Charley Patton", birth: "1891", place: "Edwards → Dockery Farms", form: "Delta Blues",
                desc: "The Father of the Delta Blues — played guitar like a weapon and a prayer simultaneously",
                legacy: "Every blues guitarist since is playing Charley Patton, whether they know it or not",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Robert Johnson", birth: "1911", place: "Hazlehurst", form: "Delta Blues",
                desc: "Twenty-nine songs and a myth that ate the world — the crossroads was always a metaphor until it wasn't",
                legacy: "Invented rock and roll in a recording studio in Texas, but the music was Mississippi's",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Son House", birth: "1902", place: "Riverton → Clarksdale", form: "Delta Blues",
                desc: "Preacher who couldn't stop playing the devil's music — the tension was the art",
                legacy: "The bridge between the church and the juke joint — without him, no blues",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Muddy Waters", birth: "1913", place: "Issaquena County → Chicago", form: "Electric Blues",
                desc: "Took the Delta to Chicago and plugged it in — the field holler electrified",
                legacy: "Without Muddy there's no Rolling Stones, no British Invasion, no rock as we know it",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Howlin' Wolf", birth: "1910", place: "White Station", form: "Electric Blues",
                desc: "Six foot three, 275 pounds of Delta blues — the most terrifying beautiful sound",
                legacy: "Taught Charley Patton's rhythms to Led Zeppelin and every heavy band since",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
            {
                name: "B.B. King", birth: "1925", place: "Itta Bena → Indianola", form: "Blues / Blues Rock",
                desc: "Made Lucille sing single notes that said more than most people's sentences",
                legacy: "The blues ambassador — carried Mississippi's gift to every corner of the planet",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Bo Diddley", birth: "1928", place: "McComb → Chicago", form: "Rock & Roll / R&B",
                desc: "The Bo Diddley beat — hambone rhythm from the plantation quarters that became rock's backbone",
                legacy: "That rhythm is Africa through Mississippi through Chicago through everything",
                era: "civil_rights", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Sam Cooke", birth: "1931", place: "Clarksdale → Chicago", form: "Soul / Gospel / Pop",
                desc: "From the church to 'A Change Is Gonna Come' — gospel truth in a pop voice",
                legacy: "Invented soul music and wrote the anthem of the Civil Rights Movement from a hotel room",
                era: "civil_rights", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Conway Twitty", birth: "1933", place: "Friars Point", form: "Country / Rock",
                desc: "Born Harold Jenkins in the Delta, became Conway Twitty — rock & roll, then country, then legend",
                legacy: "Proved the Delta's music didn't just flow one direction — its soil grew country too",
                era: "civil_rights", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Elvis Presley", birth: "1935", place: "Tupelo → Memphis", form: "Rock & Roll",
                desc: "Poor white Mississippi kid who absorbed the blues and the gospel and the country and became the catalyst",
                legacy: "The collision of cultures made audible in one voice — Mississippi's ultimate export",
                era: "civil_rights", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Jimmie Rodgers", birth: "1897", place: "Meridian", form: "Country / Blues",
                desc: "The Father of Country Music — yodeled the blues because in Mississippi, genres don't separate",
                legacy: "Proved that 'white music' and 'Black music' were always the same soil",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
        ],
    },

    // ── Literature: Mississippi Writing the World ──
    {
        category: "literature",
        figures: [
            {
                name: "William Faulkner", birth: "1897", place: "New Albany → Oxford", form: "Novels",
                desc: "Invented Yoknapatawpha County from Lafayette County's soil and won the Nobel Prize for sentences that mapped the psyche like the river maps the land",
                legacy: "The past is never dead. It's not even past. — He was talking about this soil.",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Tennessee Williams", birth: "1911", place: "Columbus → everywhere", form: "Plays",
                desc: "Staged the South's psychic wounds for Broadway — desire and cruelty performed under hot lights",
                legacy: "Blanche DuBois is Mississippi's interior life made visible — fragile, furious, unforgettable",
                era: "civil_rights", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Eudora Welty", birth: "1909", place: "Jackson", form: "Short Stories / Novels",
                desc: "Photographed and wrote Mississippi with equal precision — found the universal in every particular",
                legacy: "Showed that small-town Mississippi contained every human experience, if you looked carefully enough",
                era: "civil_rights", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Richard Wright", birth: "1908", place: "Roxie → Natchez → Jackson", form: "Novels / Memoir",
                desc: "Native Son — wrote Mississippi's violence so clearly the country couldn't look away",
                legacy: "Black Boy was the Great Migration narrated — the run from Mississippi as American epic",
                era: "civil_rights", lineage: "movement_as_identity"
            },
            {
                name: "Donna Tartt", birth: "1963", place: "Greenwood", form: "Novels",
                desc: "Novels dense as Delta topsoil — The Secret History, The Little Friend, The Goldfinch",
                legacy: "Proved Mississippi's literary soil kept producing — same weight, new century",
                era: "modern_mississippi", lineage: "mississippi_narrating_itself"
            },
            {
                name: "John Grisham", birth: "1955", place: "Jonesboro → DeSoto County", form: "Legal Thrillers",
                desc: "A Time to Kill was Mississippi's justice system laid bare in narrative form",
                legacy: "Made Mississippi's contradictions accessible to millions — the courthouse as theatre",
                era: "modern_mississippi", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Willie Morris", birth: "1934", place: "Yazoo City → New York → home", form: "Memoir / Essays",
                desc: "Left Mississippi, edited Harper's, came back — the return migrant as literary form",
                legacy: "North Toward Home — the title IS the Great Migration in four words",
                era: "modern_mississippi", lineage: "movement_as_identity"
            },
            {
                name: "Jesmyn Ward", birth: "1977", place: "DeLisle", form: "Novels",
                desc: "Two National Book Awards — Salvage the Bones, Sing Unburied Sing — Mississippi's present tense",
                legacy: "The ghosts in her novels ARE the sediment — Parchman Farm's memory in living bodies",
                era: "modern_mississippi", lineage: "mississippi_narrating_itself"
            },
        ],
    },

    // ── Visual Art: Seeing with Delta Eyes ──
    {
        category: "visual_art",
        figures: [
            {
                name: "Gerald DeLoach", birth: "—", place: "Mississippi Delta", form: "Painting / Mixed Media",
                desc: "Paints the Delta the way Charley Patton played it — no formal training, all formal truth",
                legacy: "The folk art tradition as living practice — the clay singer's descendant with acrylics",
                era: "modern_mississippi", lineage: "non_western_healing"
            },
            {
                name: "Theora Hamblett", birth: "1895", place: "Paris, MS", form: "Folk Art / Visionary",
                desc: "Painted dreams and memories with an untrained hand that saw more than most MFA graduates",
                legacy: "Mississippi folk art as American visionary tradition — outsider art that was always inside",
                era: "modern_mississippi", lineage: "non_western_healing"
            },
            {
                name: "Walter Anderson", birth: "1903", place: "Ocean Springs", form: "Painting / Murals",
                desc: "Painted the Mississippi Gulf Coast's nature with an intensity that bordered on communion",
                legacy: "Said he was 'realizing the cosmos' — the mound builder's cosmological sense in watercolor",
                era: "civil_rights", lineage: "non_western_healing"
            },
            {
                name: "The Quilt Makers of Gee's Bend", birth: "—", place: "Gee's Bend, Alabama (Delta adjacent)", form: "Textile Art",
                desc: "Quilts as abstract expressionism a century before New York invented the term",
                legacy: "African pattern memory through Mississippi fingers — geometry as inheritance",
                era: "modern_mississippi", lineage: "non_western_healing"
            },
        ],
    },

    // ── Forms: The Genres Mississippi Invented ──
    {
        category: "forms",
        figures: [
            {
                name: "The Field Holler", birth: "~1700s", place: "Cotton fields", form: "Vocal / Work Song",
                desc: "The first American music — one voice in a field, bending notes the European scale couldn't explain",
                legacy: "Every melismatic vocal run in pop music traces back to a voice in a cotton field",
                era: "plantation_era", lineage: "mississippi_narrating_itself"
            },
            {
                name: "The Ring Shout", birth: "~1700s", place: "Praise houses", form: "Sacred / Dance",
                desc: "African circle dance that became American worship — the body as instrument of praise",
                legacy: "Gospel, testimony, Pentecostal worship — all grew from the ring shout",
                era: "plantation_era", lineage: "non_western_healing"
            },
            {
                name: "Delta Blues", birth: "~1900", place: "Dockery Farms → Clarksdale", form: "Music",
                desc: "The genre that ate the world — twelve bars, three chords, and the truth",
                legacy: "Blues → Jazz → R&B → Rock → Soul → Hip-Hop — every branch grows from this root",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
            {
                name: "Mississippi Folk Art", birth: "ongoing", place: "Statewide", form: "Visual Art",
                desc: "Pottery, painting, bottle trees, yard art — the mound builder's aesthetic in contemporary materials",
                legacy: "Outsider art that was never outside — the mainstream was late, that's all",
                era: "modern_mississippi", lineage: "non_western_healing"
            },
            {
                name: "Southern Gothic", birth: "~1920s", place: "Oxford, Jackson, Columbus", form: "Literature",
                desc: "Faulkner, Williams, O'Connor (Georgia), Welty — the grotesque as truth-telling",
                legacy: "The literary form of MISSISSIPPI_IS — suffering made architecture, architecture made beautiful",
                era: "jim_crow", lineage: "mississippi_narrating_itself"
            },
        ],
    },
];
