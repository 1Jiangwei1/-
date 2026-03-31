export const RANK_BOARD_DEFINITIONS = [{ title: "人物榜", slug: "characters" }] as const;

export function isSupportedRankBoard(title: string) {
  return RANK_BOARD_DEFINITIONS.some((item) => item.title === title);
}

export function rankBoardCategoryKeywords(title: string) {
  switch (title) {
    case "人物榜":
      return ["person", "人物"];
    default:
      return [];
  }
}

export function matchesRankBoardCategory(boardTitle: string, category: string) {
  const normalizedCategory = category.trim().toLowerCase();

  if (!normalizedCategory) {
    return false;
  }

  return rankBoardCategoryKeywords(boardTitle).some((keyword) =>
    normalizedCategory.includes(keyword.toLowerCase())
  );
}
