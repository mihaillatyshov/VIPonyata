export const fixRubyStr = (str: string): string => {
    return str.replace(/<ruby>(.*?)<rt>.*?<\/rt><\/ruby>/g, "$1");
};

export const FindMaxStr = (arr: string[], pred: (str: string) => string = (str) => str) => {
    if (arr.length === 0) return "";
    return arr.reduce((a, b) => (pred(a).length > pred(b).length ? pred(a) : pred(b)));
};
