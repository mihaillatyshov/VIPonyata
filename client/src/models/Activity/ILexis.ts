import { IActivity } from "./IActivity";
import { TLexisTry } from "./Try/TLexisTry";

export interface ILexis extends IActivity<TLexisTry> {}

export enum LexisTaskName {
    CARD = "card",
    FINDPAIR = "findpair",
    SCRAMBLE = "scramble",
    SPACE = "space",
    TRANSLATE = "translate",
}

export type LexisTaskNameSelectable = Exclude<LexisTaskName, LexisTaskName.CARD>;

export const LexisImages: Record<LexisTaskName, string> = {
    card: "/img/Activity/Lexis/nav/card.png",
    findpair: "/img/Activity/Lexis/nav/findpair.png",
    scramble: "/img/Activity/Lexis/nav/scramble.png",
    space: "/img/Activity/Lexis/nav/space.png",
    translate: "/img/Activity/Lexis/nav/translate.png",
};
