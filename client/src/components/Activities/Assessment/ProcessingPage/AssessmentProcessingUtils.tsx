import React from "react";

import { AjaxGet, isProcessableError } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { IAssessmentName } from "models/Activity/IActivity";
import {
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAssessmentTeacherTypeByName,
    TTeacherAssessmentItems,
} from "models/Activity/Items/TAssessmentItems";
import { TAssessment } from "models/Activity/TAssessment";
import { TProcessingType } from "models/Processing";

import { withTeacherAssessmentImageAttachment } from "../AssessmentTaskImageWrappers";
import TeacherAssessmentAudio from "./Types/TeacherAssessmentAudio";
import TeacherAssessmentClassification from "./Types/TeacherAssessmentClassification";
import TeacherAssessmentCreateSentence from "./Types/TeacherAssessmentCreateSentence";
import TeacherAssessmentFillSpacesByHand from "./Types/TeacherAssessmentFillSpacesByHand";
import TeacherAssessmentFillSpacesExists from "./Types/TeacherAssessmentFillSpacesExists";
import TeacherAssessmentFindPair from "./Types/TeacherAssessmentFindPair";
import TeacherAssessmentImg from "./Types/TeacherAssessmentImg";
import TeacherAssessmentOpenQuestion from "./Types/TeacherAssessmentOpenQuestion";
import TeacherAssessmentSentenceOrder from "./Types/TeacherAssessmentSentenceOrder";
import TeacherAssessmentTestMulti from "./Types/TeacherAssessmentTestMulti";
import TeacherAssessmentTestSingle from "./Types/TeacherAssessmentTestSingle";
import TeacherAssessmentText from "./Types/TeacherAssessmentText";
import { TeacherAssessmentTypeProps } from "./Types/TeacherAssessmentTypeBase";

interface GetAssessmentResponse {
    assessment: TAssessment;
    tasks: TTeacherAssessmentItems;
}

export type TAliasProp<T extends TAssessmentItemBase> = (props: TeacherAssessmentTypeProps<T>) => React.ReactElement;

type TAliases = {
    [key in TAssessmentTaskName]: TAliasProp<TGetAssessmentTeacherTypeByName[key]>;
};

export const processingAliases: TAliases = {
    text: TeacherAssessmentText,
    test_single: withTeacherAssessmentImageAttachment(TeacherAssessmentTestSingle),
    test_multi: withTeacherAssessmentImageAttachment(TeacherAssessmentTestMulti),
    find_pair: withTeacherAssessmentImageAttachment(TeacherAssessmentFindPair),
    create_sentence: TeacherAssessmentCreateSentence,
    fill_spaces_exists: withTeacherAssessmentImageAttachment(TeacherAssessmentFillSpacesExists),
    fill_spaces_by_hand: withTeacherAssessmentImageAttachment(TeacherAssessmentFillSpacesByHand),
    classification: withTeacherAssessmentImageAttachment(TeacherAssessmentClassification),
    sentence_order: TeacherAssessmentSentenceOrder,
    open_question: withTeacherAssessmentImageAttachment(TeacherAssessmentOpenQuestion),
    img: TeacherAssessmentImg,
    audio: withTeacherAssessmentImageAttachment(TeacherAssessmentAudio),
    block_begin: () => <></>,
    block_end: () => <></>,
};

type GetProcessingDataReturnType =
    | {
          loadStatus: typeof LoadStatus.DONE;
          tasks: TTeacherAssessmentItems;
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
    name: IAssessmentName,
    id: number,
): Promise<GetProcessingDataReturnType> => {
    if (processingType === "edit") {
        return await getEditData(name, id);
    }

    return await getCreateData(id);
};

const getEditData = async (name: IAssessmentName, id: number): Promise<GetProcessingDataReturnType> => {
    try {
        const { assessment, tasks } = await AjaxGet<GetAssessmentResponse>({ url: `/api/${name}/${id}` });
        return {
            loadStatus: LoadStatus.DONE,
            tasks: tasks,
            timelimit: assessment.time_limit ?? "00:00:00",
            description: assessment.description ?? "",
            lessonId: assessment.lesson_id,
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
            tasks: [],
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
