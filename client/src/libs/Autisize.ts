export const FindMaxStr = (arr: string[]) => {
    if (arr.length === 0) return "";
    return arr.reduce((a, b) => (a.length > b.length ? a : b));
};
