import { AjaxGet } from "libs/ServerAPI";
import { TLessonResponse } from "models/TLesson";

import { queryOptions } from "@tanstack/react-query";

export const lessonsKeys = {
    all: ["lessons"] as const,
    detail: (lessonId: string | number) => [...lessonsKeys.all, "detail", String(lessonId)] as const,
};

export const lessonsQueries = {
    /** Урок с активностями (drilling, hieroglyph, assessment) и попытками текущего пользователя. */
    detail: (lessonId: string | number) =>
        queryOptions({
            queryKey: lessonsKeys.detail(lessonId),
            queryFn: ({ signal }) => AjaxGet<TLessonResponse>({ url: `/api/lessons/${lessonId}`, signal }),
        }),
};
