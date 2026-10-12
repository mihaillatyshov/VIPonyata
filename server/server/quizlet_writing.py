import re
import unicodedata

# Разделители вариантов чтения в word_jp: "はし / はじ", "かう、かいます".
_RE_VARIANTS_SPLIT = re.compile(r"[/／,，、;；]")
# Пробелы и знаки, которые не влияют на правильность ответа.
_RE_IGNORED = re.compile(r"[\s。．.!！?？〜~「」]")
# Иероглифы: такой char_jp не годится как эталон ответа каной.
_RE_KANJI = re.compile(r"[㐀-䶿一-鿿豈-﫿々]")

_KATAKANA_START = ord("ァ")
_KATAKANA_END = ord("ヶ")
_KATAKANA_TO_HIRAGANA_SHIFT = ord("ァ") - ord("ぁ")


def _katakana_to_hiragana(value: str) -> str:
    return "".join(
        chr(ord(char) - _KATAKANA_TO_HIRAGANA_SHIFT) if _KATAKANA_START <= ord(char) <= _KATAKANA_END else char
        for char in value)


def normalize_kana(value: str) -> str:
    """Приводит ответ к сравнимому виду: NFKC, без пробелов и пунктуации, катакана → хирагана."""
    value = unicodedata.normalize("NFKC", value)
    value = _RE_IGNORED.sub("", value)
    return _katakana_to_hiragana(value)


def _split_variants(value: str) -> set[str]:
    variants = {normalize_kana(variant) for variant in _RE_VARIANTS_SPLIT.split(value)}
    variants.discard("")
    return variants


def is_writing_answer_correct(answer: str, word_jp: str, char_jp: str | None = None) -> bool:
    normalized_answer = normalize_kana(answer)
    if normalized_answer == "":
        return False

    variants = _split_variants(word_jp)
    # Слова на катакане часто записаны только в char_jp (колонка «漢字»), а word_jp пустой.
    if char_jp and not _RE_KANJI.search(char_jp):
        variants |= _split_variants(char_jp)
    return normalized_answer in variants
