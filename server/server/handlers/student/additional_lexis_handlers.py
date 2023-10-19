import random
from typing import TypedDict

from server.exceptions.ApiExceptions import InvalidAPIUsage
import server.queries.StudentDBqueries as DBQS
from server.models.db_models import Drilling, DrillingTry, Hieroglyph, HieroglyphTry, LexisType


class ListItemType(TypedDict):
    value: str
    id: int


def create_shuffle_list_with_id(str_list: list[str]) -> list[ListItemType]:
    shuffle_str_list: list[ListItemType] = []
    for i in range(len(str_list)):
        shuffle_str_list.append({"value": str_list[i], "id": i})
    random.shuffle(shuffle_str_list)
    return shuffle_str_list


def create_shuffle_list(str_list: list[str]) -> list[str]:
    shuffle_str_list = str_list.copy()
    random.shuffle(shuffle_str_list)
    return shuffle_str_list


def create_shuffle_tuple(words_ru: list[str], words_jp: list[str],
                         chars_jp: list[str]) -> tuple[list[str], list[str], list[str]]:
    return create_shuffle_list(words_ru), create_shuffle_list(words_jp), create_shuffle_list(chars_jp)


def create_find_pair(words_ru: list[str], words_jp: list[str], chars_jp: list[str]) -> dict:
    shuffle_words_ru = create_shuffle_list_with_id(words_ru)
    shuffle_words_jp = create_shuffle_list_with_id(words_jp)
    shuffle_chars_jp = create_shuffle_list_with_id(chars_jp)
    print(
        shuffle_words_ru,
        shuffle_words_jp,
        shuffle_chars_jp,
    )
    answers = {
        "words_ru": list(map(lambda x: x['id'], shuffle_words_ru)),
        "words_jp": list(map(lambda x: x['id'], shuffle_words_jp)),
        "chars_jp": list(map(lambda x: x['id'], shuffle_chars_jp))
    }

    return {
        "words_ru": list(map(lambda x: x['value'], shuffle_words_ru)),
        "words_jp": list(map(lambda x: x['value'], shuffle_words_jp)),
        "chars_jp": list(map(lambda x: x['value'], shuffle_chars_jp)),
        "answers": answers
    }


def create_scramble(words_ru: list[str], words_jp: list[str], chars_jp: list[str]) -> dict:
    _, shuffle_words_jp, shuffle_chars_jp = create_shuffle_tuple(words_ru, words_jp, chars_jp)
    word_chars = []
    char_chars = []
    for word in shuffle_words_jp:
        word_chars.append(list(word))
        random.shuffle(word_chars[-1])
    for char in shuffle_chars_jp:
        char_chars.append(list(char))
        random.shuffle(char_chars[-1])

    return {
        "word_words": shuffle_words_jp,
        "word_chars": word_chars,
        "char_words": shuffle_chars_jp,
        "char_chars": char_chars
    }


def create_translate(words_ru: list[str], words_jp: list[str], chars_jp: list[str]) -> dict:
    return {"words_ru": words_ru, "words_jp": words_jp, "chars_jp": chars_jp}


def __get_space_from_array(words_ru: list[str], jp: list[str]) -> dict:
    spaces = []
    for i in range(len(jp)):
        word_or_char_jp = jp[i]
        length = len(word_or_char_jp)
        spaces.append({
            "word_or_char_jp": word_or_char_jp,
            "word_ru": words_ru[i],
            "word_start": word_or_char_jp[0] if length > 2 else "",
            "word_end": word_or_char_jp[-1] if length > 1 else "",
            "spaces": length - 2 if length > 2 else 1
        })

    return {"words": spaces}


def __create_space_from_words(words_ru: list[str], words_jp: list[str], _: list[str]) -> dict:
    return __get_space_from_array(words_ru, words_jp)


def __create_space_from_chars(words_ru: list[str], _: list[str], chars_jp: list[str]) -> dict:
    return __get_space_from_array(words_ru, chars_jp)


def create_space(words_ru: list[str], words_jp: list[str], chars_jp: list[str], lexis_type: type[LexisType]) -> dict:
    if lexis_type == Drilling:
        return __create_space_from_words(words_ru, words_jp, chars_jp)
    if lexis_type == Hieroglyph:
        return __create_space_from_chars(words_ru, words_jp, chars_jp)

    raise InvalidAPIUsage("Check server create_space func", 500)
