import { AjaxGet, isProcessableError } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { ImageState } from "models/Img";
import { TProcessingType } from "models/Processing";

export interface LessonProcessingForm {
    name: string;
    number: number;
    description: string;
    img: ImageState;
}

interface GetLessonResponse {
    lesson: LessonProcessingForm & { course_id: number };
}

type GetProcessingDataReturnType =
    | {
          loadStatus: typeof LoadStatus.DONE;
          lesson: LessonProcessingForm;
          courseId: number;
      }
    | {
          loadStatus: typeof LoadStatus.ERROR;
          message: string;
          needExitPage: boolean;
      };

export const getLessonProcessingData = async (
    processingType: TProcessingType,
    id: number,
): Promise<GetProcessingDataReturnType> => {
    if (processingType === "edit") {
        return await getEditData(id);
    }

    return await getCreateData(id);
};

const getEditData = async (id: number): Promise<GetProcessingDataReturnType> => {
    try {
        const { lesson } = await AjaxGet<GetLessonResponse>({ url: `/api/lessons/${id}` });
        return {
            loadStatus: LoadStatus.DONE,
            lesson: lesson,
            courseId: lesson.course_id,
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

const getCreateData = async (id: number): Promise<GetProcessingDataReturnType> => {
    try {
        await AjaxGet({ url: `/api/courses/${id}` });

        return {
            loadStatus: LoadStatus.DONE,
            lesson: {
                name: "",
                number: 500,
                description: "",
                img: { loadStatus: "NONE" },
            },
            courseId: id,
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
