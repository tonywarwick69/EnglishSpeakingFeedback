// Free-speaking exercise content. The task text is English exam content, so it
// is the same in both UI languages; `vi` glosses are shown when the UI is Vietnamese.

export const PREP_SECONDS = 60; // optional preparation time
export const MAX_SPEAK_SECONDS = 120; // recording stops automatically

export const SPEAKING_TASK = {
  title: "Talk about your favourite leisure activity.",
  titleVi: "Hãy nói về hoạt động giải trí yêu thích của em.",
  prompts: [
    { key: "p1", en: "What activity it is.", vi: "Đó là hoạt động gì." },
    { key: "p2", en: "When and where you often do it.", vi: "Em thường làm khi nào và ở đâu." },
    { key: "p3", en: "Who you do it with.", vi: "Em làm cùng với ai." },
    { key: "p4", en: "Why you like it.", vi: "Tại sao em thích hoạt động đó." },
  ],
  frames: [
    "My favourite leisure activity is __________.",
    "I often __________ in my free time.",
    "I usually do it at __________.",
    "I do it with my __________.",
    "I like/enjoy/love __________ because it is __________.",
    "It helps me __________.",
  ],
};
