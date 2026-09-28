import { useMemo, useState } from "react";

import { quizletQueries, TQuizletCatalog, TQuizletPersonalDictionary } from "api/quizlet";
import { TQuizletSessionWord } from "models/TQuizlet";

import { useQuery } from "@tanstack/react-query";

import QuizletProgressHistory from "../QuizletProgressHistory";

const addTopic = (map: Map<number, string[]>, wordId: number, title: string | undefined) => {
    if (!title) return;
    const existing = map.get(wordId) ?? [];
    if (!existing.includes(title)) {
        map.set(wordId, [...existing, title]);
    }
};

interface StudentQuizletProgressProps {
    catalog: TQuizletCatalog;
    personal: TQuizletPersonalDictionary;
}

/** «Мои успехи»: завершённые тренировки, по клику — слова тренировки. */
const StudentQuizletProgress = ({ catalog, personal }: StudentQuizletProgressProps) => {
    const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

    const statsQuery = useQuery(quizletQueries.sessionStats());
    const detailsQuery = useQuery({
        ...quizletQueries.session(expandedSessionId ?? 0),
        enabled: expandedSessionId !== null,
    });

    const finishedSessions = useMemo(
        () => (statsQuery.data?.sessions ?? []).filter((session) => session.is_finished),
        [statsQuery.data],
    );

    // Темы, к которым относится слово: из словарей учителя и из личного словаря.
    const topicsByWordId = useMemo(() => {
        const map = new Map<number, string[]>();
        const teacherTitles = new Map(catalog.subgroups.map((subgroup) => [subgroup.id, subgroup.title]));
        const personalTitles = new Map(personal.subgroups.map((subgroup) => [subgroup.id, subgroup.title]));

        catalog.subgroup_words.forEach((link) => addTopic(map, link.word_id, teacherTitles.get(link.subgroup_id)));
        personal.words.forEach((word) => {
            if (word.subgroup_id !== undefined) {
                addTopic(map, word.id, personalTitles.get(word.subgroup_id));
            }
        });

        return map;
    }, [catalog, personal]);

    const getTopicsFromSessionWords = (sessionWords: TQuizletSessionWord[]) => {
        const topics = new Set<string>();
        sessionWords.forEach((word) => {
            (topicsByWordId.get(word.source_word_id) ?? []).forEach((topic) => topics.add(topic));
        });
        return Array.from(topics);
    };

    const sessionWordsById: Record<number, TQuizletSessionWord[]> =
        expandedSessionId !== null && detailsQuery.data !== undefined
            ? { [expandedSessionId]: detailsQuery.data.words }
            : {};

    return (
        <div className="mx-auto mt-5" style={{ maxWidth: "760px" }}>
            <QuizletProgressHistory
                sessions={finishedSessions}
                isLoading={statsQuery.isPending}
                hasError={statsQuery.isError}
                expandedSessionId={expandedSessionId}
                loadingDetailsSessionId={detailsQuery.isPending ? expandedSessionId : null}
                sessionWordsById={sessionWordsById}
                onRowClick={(sessionId) => setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId))}
                onRetryLoad={() => statsQuery.refetch()}
                getTopicsFromSessionWords={getTopicsFromSessionWords}
            />
        </div>
    );
};

export default StudentQuizletProgress;
