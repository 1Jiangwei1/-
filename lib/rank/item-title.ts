type RankItemTitleSource = {
  title?: string | null;
  loreEntry?: {
    title?: string | null;
  } | null;
};

export function getRankItemDisplayTitle(item: RankItemTitleSource) {
  const customTitle = item.title?.trim();
  const loreTitle = item.loreEntry?.title?.trim();

  if (customTitle) {
    return customTitle;
  }

  if (loreTitle) {
    return loreTitle;
  }

  return "未命名对象";
}
