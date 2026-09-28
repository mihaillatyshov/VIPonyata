import { lessonsQueries } from "api/lessons";
import { useRedirectOnApiError } from "libs/useRedirectOnApiError";

import { useQuery } from "@tanstack/react-query";

/** Урок с активностями; нет урока — на главную, нет доступа — к курсу. */
export const useLessonQuery = (lessonId: string | undefined) => {
    const lessonQuery = useQuery({ ...lessonsQueries.detail(lessonId ?? ""), enabled: lessonId !== undefined });

    useRedirectOnApiError<{ course_id?: number }>(lessonQuery.error, (status, json) => {
        if (status === 404) return "/";
        if (status === 403) return `/courses/${json.course_id}`;
        return null;
    });

    return lessonQuery;
};
