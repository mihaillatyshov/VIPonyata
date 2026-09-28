import { AjaxGet, AjaxPost } from "libs/ServerAPI";
import { TLexisDoneTasks } from "models/Activity/DoneTasks/TLexisDoneTasks";
import { LexisName } from "models/Activity/IActivity";
import { ILexis } from "models/Activity/ILexis";
import { TStudentAssessmentItems } from "models/Activity/Items/TAssessmentItems";
import { TLexisItems } from "models/Activity/Items/TLexisItems";
import { TAssessment } from "models/Activity/TAssessment";

import { queryOptions } from "@tanstack/react-query";

export interface TStudentLexisResponse {
    lexis: ILexis;
    items: TLexisItems;
}

export interface TStudentAssessmentResponse {
    assessment: TAssessment;
    items: TStudentAssessmentItems;
}

export const activityKeys = {
    all: ["activity"] as const,
    studentLexis: (name: LexisName, id: string | number) => [...activityKeys.all, name, String(id)] as const,
    studentAssessment: (id: string | number) => [...activityKeys.all, "assessment", String(id)] as const,
};

/**
 * Прохождение активности учеником. Ответы ученика хранятся в кеше запроса (`setQueryData`) и сохраняются
 * на сервер по ходу работы, поэтому данные не перезапрашиваются, пока страница открыта (`staleTime: Infinity`),
 * и не переживают уход со страницы (`gcTime: 0`): при следующем заходе прогресс берётся с сервера.
 */
export const activityQueries = {
    studentLexis: (name: LexisName, id: string | number) =>
        queryOptions({
            queryKey: activityKeys.studentLexis(name, id),
            queryFn: ({ signal }) => AjaxGet<TStudentLexisResponse>({ url: `/api/${name}/${id}`, signal }),
            staleTime: Infinity,
            gcTime: 0,
        }),
    studentAssessment: (id: string | number) =>
        queryOptions({
            queryKey: activityKeys.studentAssessment(id),
            queryFn: ({ signal }) => AjaxGet<TStudentAssessmentResponse>({ url: `/api/assessment/${id}`, signal }),
            staleTime: Infinity,
            gcTime: 0,
        }),
};

export const saveLexisDoneTasks = (name: LexisName, id: string | number, doneTasks: TLexisDoneTasks) =>
    AjaxPost({ url: `/api/${name}/${id}/newdonetask`, body: { done_tasks: doneTasks } });
