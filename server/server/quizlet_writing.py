import re
import unicodedata

# Разделители вариантов чтения в word_jp: "はし / はじ", "かう、かいます".
_RE_VARIANTS_SPLIT = re.compile(r"[/／,，、;；]")
# Пробелы и знаки, которые не влияют на правильность ответа.
_RE_IGNORED = re.compile(r"[\s。．.!！?？〜~「」]")

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


def is_writing_answer_correct(answer: str, word_jp: str) -> bool:
    normalized_answer = normalize_kana(answer)
    if normalized_answer == "":
        return False

    variants = {normalize_kana(variant) for variant in _RE_VARIANTS_SPLIT.split(word_jp)}
    variants.discard("")
    return normalized_answer in variants
