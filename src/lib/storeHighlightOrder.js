export function sortStoreHighlights(highlights) {
  return [...highlights].sort((first, second) => {
    const pinnedOrder = Number(Boolean(second.isPinned)) - Number(Boolean(first.isPinned));
    if (pinnedOrder !== 0) return pinnedOrder;

    const firstOrder = Number(first.order);
    const secondOrder = Number(second.order);
    const orderedFirst = Number.isFinite(firstOrder) && firstOrder > 0 ? firstOrder : Infinity;
    const orderedSecond = Number.isFinite(secondOrder) && secondOrder > 0 ? secondOrder : Infinity;

    if (orderedFirst !== orderedSecond) return orderedFirst - orderedSecond;
    return new Date(first.createdAt || 0).getTime() - new Date(second.createdAt || 0).getTime();
  });
}
