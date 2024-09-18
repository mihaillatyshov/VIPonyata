import { AjaxGet, isProcessableError } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { LexisName } from "models/Activity/IActivity";
import { ILexis, LexisTaskName } from "models/Activity/ILexis";
import { TCreateCardItem } from "models/Activity/Items/TLexisItems";
import { TProcessingType } from "models/Processing";
import { TDictionaryItem } from "models/TDictionary";

export type SelectableTask = { name: LexisTaskName; isSelected: boolean };

interface GetLexisResponse {
    lexis: ILexis;
    cards: TCreateCardItem[];
    dictionary: TDictionaryItem[];
}

type GetProcessingDataReturnType =
    | {
          loadStatus: typeof LoadStatus.DONE;
          tasks: SelectableTask[];
          dictionaryWords: TDictionaryItem[];
          lexisCards: TCreateCardItem[];
          timelimit: string;
          description: string;
          lessonId: number;
      }
    | {
          loadStatus: typeof LoadStatus.ERROR;
          message: string;
          needExitPage: boolean;
      };

export const getProcessingData = async (
    processingType: TProcessingType,
    name: LexisName,
    id: number,
): Promise<GetProcessingDataReturnType> => {
    if (processingType === "edit") {
        return await getEditData(name, id);
    }

    return await getCreateData(id);
};

const getEditData = async (name: LexisName, id: number): Promise<GetProcessingDataReturnType> => {
    try {
        const { lexis, cards, dictionary } = await AjaxGet<GetLexisResponse>({ url: `/api/${name}/${id}` });
        return {
            loadStatus: LoadStatus.DONE,
            tasks: getTasksArray(lexis.tasks.split(",")),
            dictionaryWords: dictionary,
            lexisCards: cards,
            timelimit: lexis.time_limit ?? "00:00:00",
            description: lexis.description ?? "",
            lessonId: lexis.lesson_id,
        };
    } catch (error) {
        if (isProcessableError(error)) {
            return {
                loadStatus: LoadStatus.ERROR,
                message: "Ошибка при получении данных",
                needExitPage: error.response.status === 404,
            };
        }
        return {
            loadStatus: LoadStatus.ERROR,
            message: "Неизвестная ошибка",
            needExitPage: false,
        };
    }
};

const getCreateData = async (lessonId: number): Promise<GetProcessingDataReturnType> => {
    try {
        await AjaxGet({ url: `/api/lessons/${lessonId}` });

        return {
            loadStatus: LoadStatus.DONE,
            tasks: getTasksArray(),
            dictionaryWords: [],
            lexisCards: [],
            timelimit: "00:00:00",
            description: "",
            lessonId: lessonId,
        };
    } catch (error) {
        if (isProcessableError(error)) {
            return {
                loadStatus: LoadStatus.ERROR,
                message: "Ошибка при получении данных",
                needExitPage: true,
            };
        }
        return {
            loadStatus: LoadStatus.ERROR,
            message: "Неизвестная ошибка",
            needExitPage: false,
        };
    }
};

const getTasksArray = (selectedTasks: string[] = []): SelectableTask[] => {
    return Object.values(LexisTaskName)
        .filter((taskName) => taskName !== "card")
        .map((taskName) => ({ name: taskName, isSelected: selectedTasks.includes(taskName) }));
};

export const getModalDefaultText = (dictionaryWords: TDictionaryItem[]): string => {
    return dictionaryWords.map((item) => [item.ru, item.word_jp ?? "", item.char_jp ?? ""].join("\t")).join("\n");
};
