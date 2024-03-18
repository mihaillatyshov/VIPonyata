import { TLexisDoneTasks } from "../DoneTasks/TLexisDoneTasks";
import { IActivityTry } from "./IActivityTry";

export interface TLexisTry extends IActivityTry {
    done_tasks: TLexisDoneTasks;
    base_id: number;
}

export interface TStudentLexisTryBase {
    type: string;
    mistakeCount: number;
}

export interface TStudentLexisTryFindPairTask extends TStudentLexisTryBase {
    selectedField: { id: number; type: "None" | "words_jp" | "words_ru" | "chars_jp" };
    doneFields: { [K: string]: number }[];
}

export interface TStudentLexisTryScrambleTask extends TStudentLexisTryBase {
    wordId: number;
    usedChars: string[];
    doneWord: string[];
}

export interface TStudentLexisTrySpaceTask extends TStudentLexisTryBase {
    wordId: number;
    parts: string[];
    in_parts: string[];
}

export interface TStudentLexisTranslateTask extends TStudentLexisTryBase {
    wordId: number;
    inputText: string;
    wordRU: string;
}
