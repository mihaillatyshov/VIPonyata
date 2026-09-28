import {
    createQuizletGroup,
    createQuizletSubgroup,
    createQuizletWordsBatch,
    deleteQuizletGroup,
    deleteQuizletSubgroup,
    quizletKeys,
    quizletQueries,
    removeQuizletWordFromSubgroup,
    TQuizletCatalog,
    updateQuizletGroup,
    updateQuizletSubgroup,
    updateQuizletWord,
} from "api/quizlet";
import { TQuizletGroup, TQuizletSubgroup } from "models/TQuizlet";

import { useQueryClient } from "@tanstack/react-query";

import { QuizletWordsChanges } from "../shared/QuizletWordsEditor";
import { getNextSort, getSubgroupWords, moveItem, QUIZLET_SORT_STEP } from "./teacherQuizletUtils";

/** Изменения каталога учителя (уроки, темы, слова). Каждое действие дожидается обновлённого каталога. */
export const useTeacherCatalogActions = (catalog: TQuizletCatalog) => {
    const queryClient = useQueryClient();

    const refreshCatalog = () => queryClient.invalidateQueries({ queryKey: quizletKeys.catalog() });

    const getGroupTopics = (groupId: number) => catalog.subgroups.filter((subgroup) => subgroup.group_id === groupId);

    /** Перенумеровывает sort с шагом QUIZLET_SORT_STEP и сохраняет только изменившиеся элементы. */
    const persistOrder = async <T extends { id: number; title: string; sort: number }>(
        orderedItems: T[],
        update: (id: number, title: string, sort: number) => Promise<unknown>,
    ) => {
        const requests = orderedItems
            .map((item, index) => ({ item, sort: (index + 1) * QUIZLET_SORT_STEP }))
            .filter(({ item, sort }) => item.sort !== sort)
            .map(({ item, sort }) => update(item.id, item.title, sort));

        if (requests.length === 0) {
            return;
        }

        await Promise.all(requests);
        await refreshCatalog();
    };

    return {
        createLesson: async (title: string) => {
            const response = await createQuizletGroup(title, getNextSort(catalog.groups));
            await refreshCatalog();
            return response.group;
        },
        renameLesson: async (group: TQuizletGroup, title: string) => {
            await updateQuizletGroup(group.id, title, group.sort);
            await refreshCatalog();
        },
        moveLesson: (groupId: number, direction: -1 | 1) =>
            persistOrder(moveItem(catalog.groups, groupId, direction), updateQuizletGroup),
        deleteLesson: async (group: TQuizletGroup) => {
            await deleteQuizletGroup(group.id);
            await refreshCatalog();
        },
        createTopic: async (groupId: number, title: string) => {
            const response = await createQuizletSubgroup(groupId, title, getNextSort(getGroupTopics(groupId)));
            await refreshCatalog();
            return response.subgroup;
        },
        renameTopic: async (subgroup: TQuizletSubgroup, title: string) => {
            await updateQuizletSubgroup(subgroup.id, title, subgroup.sort);
            await refreshCatalog();
        },
        moveTopic: (groupId: number, subgroupId: number, direction: -1 | 1) =>
            persistOrder(moveItem(getGroupTopics(groupId), subgroupId, direction), updateQuizletSubgroup),
        /** Каталог обновляется в фоне — можно сразу уйти со страницы удалённой темы. */
        deleteTopic: async (subgroup: TQuizletSubgroup) => {
            await deleteQuizletSubgroup(subgroup.id);
            refreshCatalog();
        },
        saveTopicWords: async (subgroup: TQuizletSubgroup, changes: QuizletWordsChanges) => {
            for (const wordId of changes.deletedIds) {
                await removeQuizletWordFromSubgroup(subgroup.id, wordId);
            }
            if (changes.created.length > 0) {
                await createQuizletWordsBatch(changes.created.map((word) => ({ ...word, subgroup_id: subgroup.id })));
            }
            for (const { id, ...word } of changes.updated) {
                await updateQuizletWord(id, word);
            }

            const freshCatalog = await queryClient.fetchQuery({ ...quizletQueries.catalog(), staleTime: 0 });
            return getSubgroupWords(freshCatalog, subgroup.id);
        },
    };
};
