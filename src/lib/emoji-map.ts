/**
 * GitLab Emoji Name to Unicode Mapping
 *
 * Maps GitLab emoji names (like "thumbsup") to Unicode characters.
 * Used for displaying reactions fetched from GitLab Award Emoji API.
 *
 * Full list: https://docs.gitlab.com/ee/user/markdown.html#emoji
 */

export const emojiMap: Record<string, string> = {
  // Common reactions (most frequently used)
  thumbsup: "👍",
  thumbsdown: "👎",
  heart: "❤️",
  smile: "😄",
  laughing: "😆",
  blush: "😊",
  grinning: "😀",
  relaxed: "☺️",
  wink: "😉",
  joy: "😂",
  smiley: "😃",

  // Celebration
  tada: "🎉",
  confetti_ball: "🎊",
  balloon: "🎈",
  trophy: "🏆",
  medal: "🏅",

  // Thinking/Working
  thinking: "🤔",
  eyes: "👀",
  rocket: "🚀",
  fire: "🔥",
  bulb: "💡",
  zap: "⚡",
  hammer: "🔨",
  wrench: "🔧",

  // Positive
  clap: "👏",
  raised_hands: "🙌",
  ok_hand: "👌",
  muscle: "💪",
  star: "⭐",
  sparkles: "✨",
  "100": "💯",
  white_check_mark: "✅",
  heavy_check_mark: "✔️",

  // Negative/Concern
  disappointed: "😞",
  worried: "😟",
  confused: "😕",
  cry: "😢",
  x: "❌",
  warning: "⚠️",
  no_entry: "⛔",

  // Misc common
  question: "❓",
  exclamation: "❗",
  point_up: "☝️",
  point_down: "👇",
  point_left: "👈",
  point_right: "👉",
  wave: "👋",
  pray: "🙏",
  bow: "🙇",
  coffee: "☕",
  beer: "🍺",
  pizza: "🍕",

  // Animals/Nature (sometimes used)
  bug: "🐛",
  bee: "🐝",
  butterfly: "🦋",
  snail: "🐌",
  turtle: "🐢",
  rabbit: "🐰",
  cat: "🐱",
  dog: "🐶",

  // Objects
  lock: "🔒",
  unlock: "🔓",
  key: "🔑",
  bell: "🔔",
  bookmark: "🔖",
  link: "🔗",
  pushpin: "📌",
  memo: "📝",
  pencil: "✏️",
  scissors: "✂️",
  paperclip: "📎",
  file_folder: "📁",
  open_file_folder: "📂",
};

/**
 * Get Unicode emoji for GitLab emoji name
 *
 * @param name - GitLab emoji name (e.g., "thumbsup", "heart")
 * @returns Unicode emoji or `:name:` fallback if not found
 */
export function getEmoji(name: string): string {
  return emojiMap[name] ?? `:${name}:`;
}
