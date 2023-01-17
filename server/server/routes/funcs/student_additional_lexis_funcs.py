import random
import typing

from ...ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from ...queries import StudentDBqueries as DBQS
from ...DBlib import Drilling, DoneDrilling


class LexisType:
    DRILLING = 0
    HIEROGLYPH = 1


class LexisTaskName:
    CARD = "card"
    FINDPAIR = "findpair"
    SCRAMBLE = "scramble"
    TRANSLATE = "translate"
    SPACE = "space"


LexisTaskNameList = [
    value for name, value in vars(LexisTaskName).items()
    if not callable(getattr(LexisTaskName, name)) and not name.startswith("__")
]


def GetLexisData(lexisType: int) -> tuple[typing.Callable[[int, int], Drilling],                                        #
                                          typing.Callable[[int, int], DoneDrilling],                                    #
                                          str]:                                                                         #
    if lexisType == LexisType.DRILLING:
        return DBQS.GetDrillingById, DBQS.GetUnfinishedDoneDrillingsByDrillingId, "drilling"

    #if lexisType == LexisType.HIEROGLYPH:
    #    return DBQS.GetHye

    raise InvalidAPIUsage("Check server GetLexisData()", 500)


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

    return {"word_words": shuffleWordsJP, "word_chars": word_chars}


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


def CreateSpace(wordsRU: list[str], wordsJP: list[str], charsJP: list[str], lexisType: int) -> dict:
    if lexisType == LexisType.DRILLING:
        return CreateSpaceFromWords(wordsRU, wordsJP, charsJP)
    if lexisType == LexisType.HIEROGLYPH:
        return CreateSpaceFromChars(wordsRU, wordsJP, charsJP)

    raise InvalidAPIUsage("Check server CreateSpace()", 500)
