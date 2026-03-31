export const COMMUNITY_CATEGORIES = [
  "综合讨论",
  "设定考据",
  "剧情讨论",
  "问题求助",
] as const;

const CATEGORY_MARKER_START = "[[category:";
const CATEGORY_MARKER_END = "]]";

export function encodeCommunityPostContent(category: string, body: string) {
  return `${CATEGORY_MARKER_START}${category}${CATEGORY_MARKER_END}\n${body.trim()}`;
}

export function decodeCommunityPostContent(content: string | null | undefined) {
  const raw = content ?? "";

  if (!raw.startsWith(CATEGORY_MARKER_START)) {
    return {
      category: "综合讨论",
      body: raw,
    };
  }

  const markerEndIndex = raw.indexOf(CATEGORY_MARKER_END);

  if (markerEndIndex === -1) {
    return {
      category: "综合讨论",
      body: raw,
    };
  }

  const category = raw
    .slice(CATEGORY_MARKER_START.length, markerEndIndex)
    .trim();
  const body = raw.slice(markerEndIndex + CATEGORY_MARKER_END.length).trimStart();

  return {
    category: category || "综合讨论",
    body,
  };
}

export function normalizeCommunityCategory(category: string) {
  return COMMUNITY_CATEGORIES.includes(category as (typeof COMMUNITY_CATEGORIES)[number])
    ? category
    : "综合讨论";
}
