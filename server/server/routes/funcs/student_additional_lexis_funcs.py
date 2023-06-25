import random
import typing

from server.exceptions.ApiExceptions import InvalidAPIUsage
import server.queries.StudentDBqueries as DBQS
from ...db_models import Drilling, DrillingTry, Hieroglyph, HieroglyphTry, LexisType


def CreateShuffleList(strList: list[str]) -> list[str]:
    shuffleStrList = strList.copy()
    random.shuffle(shuffleStrList)
    return shuffleStrList


def CreateShuffleTuple(wordsRU: list[str], wordsJP: list[str],
                       charsJP: list[str]) -> tuple[list[str], list[str], list[str]]:
    return CreateShuffleList(wordsRU), CreateShuffleList(wordsJP), CreateShuffleList(charsJP)


def CreateFindPair(wordsRU: list[str], wordsJP: list[str], charsJP: list[str]) -> dict:
    shuffleWordsRU, shuffleWordsJP, shuffleCharsJP = CreateShuffleTuple(wordsRU, wordsJP, charsJP)
    answers = {"words_ru": [], "words_jp": [], "chars_jp": []}
    for word in shuffleWordsRU:
        answers["words_ru"].append(shuffleWordsRU.index(word))
        answers["words_jp"].append(shuffleWordsJP.index(wordsJP[wordsRU.index(word)]))
        answers["chars_jp"].append(shuffleCharsJP.index(charsJP[wordsRU.index(word)]))

    return {"words_ru": shuffleWordsRU, "words_jp": shuffleWordsJP, "chars_jp": shuffleCharsJP, "answers": answers}


def CreateScramble(wordsRU: list[str], wordsJP: list[str], charsJP: list[str]) -> dict:
    _, shuffleWordsJP, shuffleCharsJP = CreateShuffleTuple(wordsRU, wordsJP, charsJP)
    word_chars = []
    char_chars = []
    for word in shuffleWordsJP:
        word_chars.append(list(word))
        random.shuffle(word_chars[-1])
    for char in shuffleCharsJP:
        char_chars.append(list(char))
        random.shuffle(char_chars[-1])

    return {
        "word_words": shuffleWordsJP,
        "word_chars": word_chars,
        "char_words": shuffleCharsJP,
        "char_chars": char_chars
    }


def CreateTranslate(wordsRU: list[str], wordsJP: list[str], charsJP: list[str]) -> dict:
    return {"words_ru": wordsRU, "words_jp": wordsJP, "chars_jp": charsJP}


def __getSpaceFromArray(wordsRU: list[str], JP: list[str]) -> dict:
    spaces = []
    for i in range(len(JP)):
        word_or_char_jp = JP[i]
        length = len(word_or_char_jp)
        spaces.append({
            "word_or_char_jp": word_or_char_jp,
            "word_ru": wordsRU[i],
            "word_start": word_or_char_jp[0] if length > 2 else "",
            "word_end": word_or_char_jp[-1] if length > 1 else "",
            "spaces": length - 2 if length > 2 else 1
        })

    return {"words": spaces}


def CreateSpaceFromWords(wordsRU: list[str], wordsJP: list[str], charsJP: list[str]) -> dict:
    return __getSpaceFromArray(wordsRU, wordsJP)


def CreateSpaceFromChars(wordsRU: list[str], wordsJP: list[str], charsJP: list[str]) -> dict:
    return __getSpaceFromArray(wordsRU, charsJP)


def CreateSpace(wordsRU: list[str], wordsJP: list[str], charsJP: list[str], lexis_type: LexisType) -> dict:
    if lexis_type == Drilling:
        return CreateSpaceFromWords(wordsRU, wordsJP, charsJP)
    if lexis_type == Hieroglyph:
        return CreateSpaceFromChars(wordsRU, wordsJP, charsJP)

    raise InvalidAPIUsage("Check server CreateSpace()", 500)
