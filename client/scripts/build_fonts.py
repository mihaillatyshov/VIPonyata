"""Генерирует WOFF2-шрифты для клиента из исходных TTF в client/fonts-src.

Запуск (из client/):
    python -m pip install fonttools brotli
    python scripts/build_fonts.py

APJapanesefont (5.6 МБ TTF) режется на части по диапазонам Unicode; в App.css у каждой части свой
@font-face с unicode-range, и браузер скачивает только те части, символы которых есть на странице.
Диапазоны ниже должны совпадать с unicode-range в src/App.css.
"""

from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fonts-src"
OUT = ROOT / "src" / "assets" / "fonts"


def in_ranges(cp: int, ranges: list[tuple[int, int]]) -> bool:
    return any(start <= cp <= end for start, end in ranges)


KANA = [(0xA5, 0xA5), (0x3000, 0x30FF), (0xFF00, 0xFF9F)]
KANJI = [(0x3400, 0x4DB5), (0x4E00, 0x9FFF)]


def build(src: Path, out: Path, unicodes: set[int]) -> None:
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.glyph_names = False
    # mort — устаревшая таблица Apple, gasp в APJapanesefont повреждена (fontTools не может её прочитать)
    options.drop_tables += ["mort", "gasp", "DSIG"]

    font = TTFont(src)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(out)
    print(f"{out.name}: {len(unicodes)} символов, {out.stat().st_size // 1024} КБ")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    ap_src = SRC / "APJapanesefont.ttf"
    ap_cmap = set(TTFont(ap_src).getBestCmap())
    kana = {cp for cp in ap_cmap if in_ranges(cp, KANA)}
    kanji = {cp for cp in ap_cmap if in_ranges(cp, KANJI)}
    latin = ap_cmap - kana - kanji
    build(ap_src, OUT / "APJapanesefont-latin.woff2", latin)
    build(ap_src, OUT / "APJapanesefont-kana.woff2", kana)
    build(ap_src, OUT / "APJapanesefont-kanji.woff2", kanji)

    gothic_src = SRC / "CenturyGothicPaneuropeanRegular.ttf"
    build(gothic_src, OUT / "CenturyGothicPaneuropeanRegular.woff2", set(TTFont(gothic_src).getBestCmap()))


if __name__ == "__main__":
    main()
