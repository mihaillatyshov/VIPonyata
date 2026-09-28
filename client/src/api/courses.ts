import { AjaxGet } from "libs/ServerAPI";
import { TCourse } from "models/TCourse";
import { TLesson, TUnfinishedLessonsSummary } from "models/TLesson";

import { queryOptions } from "@tanstack/react-query";

export interface TCoursesListResponse {
    items: TCourse[];
    unfinished_lessons?: TUnfinishedLessonsSummary;
}

export interface TCourseResponse {
    course: TCourse;
    items: TLesson[];
    unfinished_lessons?: TUnfinishedLessonsSummary;
}

export const coursesKeys = {
    all: ["courses"] as const,
    list: () => [...coursesKeys.all, "list"] as const,
    detail: (courseId: string | number) => [...coursesKeys.all, "detail", String(courseId)] as const,
};

export const coursesQueries = {
    /** Доступные курсы и сводка незавершённых уроков ученика. */
    list: () =>
        queryOptions({
            queryKey: coursesKeys.list(),
            queryFn: ({ signal }) => AjaxGet<TCoursesListResponse>({ url: "/api/courses", signal }),
        }),
    /** Курс с уроками. */
    detail: (courseId: string | number) =>
        queryOptions({
            queryKey: coursesKeys.detail(courseId),
            queryFn: ({ signal }) => AjaxGet<TCourseResponse>({ url: `/api/courses/${courseId}`, signal }),
        }),
};
