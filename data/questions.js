// Speaking practice content — Unit 1: My New School (Tieng Anh 6, Global Success)
// 3 levels: Recognition -> Comprehension -> High Application
//
// Text shown in the UI (level names, instructions) lives in /locales/*.js and is
// looked up by `level.key` and `instructionKey`. Only the English target (what the
// student must say) and the Vietnamese meaning (`vi`, shown in the Vietnamese UI)
// are stored here.
//
// matchThreshold: minimum similarity ratio (0-1) between what the student says and
// the target to be marked correct.

export const LEVELS = {
  RECOGNITION: { key: "recognition", color: "signal" },
  COMPREHENSION: { key: "comprehension", color: "amber" },
  APPLICATION: { key: "application", color: "pulse" },
};

// Minimum Azure PronScore (0-100) to count an answer as correct, per level.
// Tune these using real student recordings.
export const PASS_THRESHOLDS = {
  recognition: 70,
  comprehension: 65,
  application: 60,
};

export const QUESTIONS = [
  { id: 1, level: LEVELS.RECOGNITION, type: "word", target: "compass", ipa: "/ˈkʌmpəs/", vi: "com-pa (dụng cụ học tập)", matchThreshold: 0.8 },
  { id: 2, level: LEVELS.RECOGNITION, type: "word", target: "homework", ipa: "/ˈhəʊmwɜːk/", vi: "bài tập về nhà", matchThreshold: 0.8 },
  { id: 3, level: LEVELS.RECOGNITION, type: "word", target: "subject", ipa: "/ˈsʌbdʒɪkt/", vi: "môn học", matchThreshold: 0.8 },
  { id: 4, level: LEVELS.RECOGNITION, type: "word", target: "uniform", ipa: "/ˈjuːnɪfɔːm/", vi: "đồng phục", matchThreshold: 0.8 },
  { id: 5, level: LEVELS.COMPREHENSION, type: "phrase", target: "a new school bag", ipa: "", vi: "một chiếc cặp sách mới", matchThreshold: 0.72 },
  { id: 6, level: LEVELS.COMPREHENSION, type: "phrase", target: "study English and History", ipa: "", vi: "học tiếng Anh và Lịch sử", matchThreshold: 0.72 },
  { id: 7, level: LEVELS.COMPREHENSION, type: "phrase", target: "look smart in a uniform", ipa: "", vi: "trông thật bảnh bao trong bộ đồng phục", matchThreshold: 0.72 },
  { id: 8, level: LEVELS.APPLICATION, type: "sentence", target: "I have new books and new subjects to study.", ipa: "", vi: "Tớ có sách mới và những môn học mới để học.", matchThreshold: 0.62 },
  { id: 9, level: LEVELS.APPLICATION, type: "sentence", target: "We always look smart in our uniforms.", ipa: "", vi: "Chúng tôi luôn trông thật bảnh bao trong bộ đồng phục.", matchThreshold: 0.62 },
  { id: 10, level: LEVELS.APPLICATION, type: "sentence", instructionKey: "sentenceTopic", target: "I would like to go to Dream School because I can join the art club.", ipa: "", vi: "Tớ muốn học ở Dream School vì tớ có thể tham gia câu lạc bộ mỹ thuật.", matchThreshold: 0.58 },
];
