// Rule-based check of the speaking task: did the student say what the activity
// is, when / where / who with, and why? Also detects the "useful language" frames.
// It looks for keywords, so it is a helpful guide, not an exact judge.

const norm = (s) =>
  ` ${String(s || "")
    .toLowerCase()
    .replace(/favorite/g, "favourite")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

const has = (text, re) => re.test(text);

const ACTIVITIES =
  "reading|swimming|football|soccer|badminton|basketball|volleyball|tennis|table tennis|cycling|biking|drawing|painting|singing|dancing|cooking|baking|gaming|chess|music|guitar|piano|violin|running|jogging|hiking|camping|fishing|gardening|photography|taking photos|watching movies|watching tv|watching films|listening to music|playing games|video games|board games|skateboarding|yoga|karate|taekwondo|martial arts|knitting|collecting|writing|swim|read|draw|paint|sing|dance|cook|play|cycle|run|jog";

const PLACES =
  "home|school|park|garden|yard|library|gym|pool|swimming pool|playground|beach|club|cinema|stadium|field|room|bedroom|house|living room|river|lake|street|sports centre|sports center|youth centre|neighbourhood|village|town|city|countryside|yard|courtyard|kitchen|backyard";

const ACTIVITY_RE = new RegExp("\\b(" + ACTIVITIES + ")\\b");

const TIME_RE =
  /\b(free time|spare time|weekends?|evenings?|mornings?|afternoons?|nights?|after school|before school|after class|every (day|week|morning|evening|weekend|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?|in the (morning|afternoon|evening)|once a week|twice a week|three times a week|summer|holidays?|usually|often|sometimes|always)\b/;

const PLACE_RE = new RegExp("\\b(at|in|on|near|to|inside|outside) (the |my |a |an |our )?(" + PLACES + ")\\b");
const AT_HOME_RE = /\bat home\b/;

const WHO_RE =
  /\b(with (my|our|a|some|the|his|her) |by myself|alone|on my own|with (friends|family|classmates|brothers?|sisters?|parents|mum|mom|dad|cousins?|grandparents?|teammates?|neighbou?rs?|people))\b/;

const WHY_RE =
  /\b(because|that's why|that is why|it is (fun|relaxing|interesting|exciting|useful|healthy|good|great|enjoyable|helpful|boring|cool|amazing|wonderful)|it's (fun|relaxing|interesting|exciting|useful|healthy|good|great|enjoyable|helpful|cool|amazing|wonderful)|it helps me|it makes me|helps me|makes me)\b/;

export const CHECK_KEYS = ["activity", "when", "where", "who", "why"];

export function analyseTask(transcript) {
  const text = norm(transcript);

  const activity =
    has(text, /\bfavourite (leisure )?activity is\b/) ||
    has(text, ACTIVITY_RE) ||
    has(text, /\bi (like|love|enjoy) (to )?\w+/);
  const when = has(text, TIME_RE);
  const where = has(text, PLACE_RE) || has(text, AT_HOME_RE);
  const who = has(text, WHO_RE);
  const why = has(text, WHY_RE);

  const checks = { activity, when, where, who, why };
  const covered = CHECK_KEYS.filter((k) => checks[k]).length;

  // The 6 "useful language" frames from the task, in the same order
  const frames = [
    has(text, /\bmy favourite leisure activity is\b/),
    has(text, /\bin my free time\b/) || has(text, /\bi (often|usually|sometimes) \w+/),
    has(text, /\b(usually|often)? ?do it (at|in|on)\b/) || has(text, /\bi usually do it\b/),
    has(text, /\bdo it with (my|our)?\b/) || has(text, /\bi do it with\b/),
    has(text, /\bbecause (it is|it's)\b/),
    has(text, /\bit helps me\b/),
  ];

  return { checks, covered, total: CHECK_KEYS.length, frames };
}
