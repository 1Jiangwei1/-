const CATEGORY_LABELS: Record<string, string> = {
  person: "人物",
  shentong: "神通",
  jinshi: "金性",
  org: "势力",
  fabao: "法宝",
  gongfa: "功法",
  lingwu: "灵物",
  lingzhen: "灵阵",
  lingfen: "灵氛",
};

export function getLoreCategoryLabel(category?: string | null) {
  if (!category) {
    return "其他";
  }

  return CATEGORY_LABELS[category] ?? "其他";
}
