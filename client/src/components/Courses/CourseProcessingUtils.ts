import { AjaxGet, isProcessableError } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { ImageState } from "models/Img";
import { TProcessingType } from "models/Processing";

export interface CourseProcessingForm {
    name: string;
    difficulty: string;
    difficultyColor: string;
    sort: number;
    description: string;
    img: ImageState;
}

interface GetCourseResponse {
    course: CourseProcessingForm;
}

type GetProcessingDataReturnType =
    | {
          loadStatus: typeof LoadStatus.DONE;
          course: CourseProcessingForm;
      }
    | {
          loadStatus: typeof LoadStatus.ERROR;
          message: string;
          needExitPage: boolean;
      };

export const getCourseProcessingData = async (
    processingType: TProcessingType,
    id: number,
): Promise<GetProcessingDataReturnType> => {
    if (processingType === "edit") {
        return await getEditData(id);
    }

    return await getCreateData();
};

const getEditData = async (id: number): Promise<GetProcessingDataReturnType> => {
    try {
        const { course } = await AjaxGet<GetCourseResponse>({ url: `/api/courses/${id}` });
        return {
            loadStatus: LoadStatus.DONE,
            course: course,
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

const getCreateData = async (): Promise<GetProcessingDataReturnType> => {
    return {
        loadStatus: LoadStatus.DONE,
        course: {
            name: "",
            difficulty: "",
            difficultyColor: "",
            sort: 500,
            description: "",
            img: { loadStatus: "NONE" },
        },
    };
};
