import { useEffect, useMemo, useState } from "react";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import {
    TQuizletGroup,
    TQuizletLesson,
    TQuizletSession,
    TQuizletSessionWord,
    TQuizletSubgroup,
    TQuizletSubgroupWord,
    TQuizletWord,
} from "models/TQuizlet";

import FlashcardExercise from "./FlashcardExercise";
import MatchingExercise from "./MatchingExercise";
import QuizletQuizStart from "./QuizletQuizStart";
import QuizletSessionResults from "./QuizletSessionResults";
import { formatDuration, parseQueue } from "./quizletUtils";

interface CatalogResponse {
    groups: TQuizletGroup[];
    subgroups: TQuizletSubgroup[];
    subgroup_words: TQuizletSubgroupWord[];
    words: TQuizletWord[];
}

interface PersonalResponse {
    lesson: TQuizletLesson | null;
    subgroups: TQuizletSubgroup[];
    words: TQuizletWord[];
}

interface SessionResponse {
    session: TQuizletSession & { queue_state?: string };
    words: TQuizletSessionWord[];
}

const StudentQuizlet = () => {
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);

    const [groups, setGroups] = useState<TQuizletGroup[]>([]);
    const [subgroups, setSubgroups] = useState<TQuizletSubgroup[]>([]);
    const [subgroupWords, setSubgroupWords] = useState<TQuizletSubgroupWord[]>([]);
    const [words, setWords] = useState<TQuizletWord[]>([]);

    const [personalLesson, setPersonalLesson] = useState<TQuizletLesson | null>(null);
    const [personalSubgroups, setPersonalSubgroups] = useState<TQuizletSubgroup[]>([]);

    const [session, setSession] = useState<(TQuizletSession & { queue_state?: string }) | null>(null);
    const [sessionWords, setSessionWords] = useState<TQuizletSessionWord[]>([]);

    const [newLessonTitle, setNewLessonTitle] = useState<string>("");
    const [newSubgroupTitle, setNewSubgroupTitle] = useState<string>("");
    const [newWord, setNewWord] = useState<{ subgroup_id: number; char_jp: string; word_jp: string; ru: string }>({
        subgroup_id: 0,
        char_jp: "",
        word_jp: "",
        ru: "",
    });

    const [lastStartPayload, setLastStartPayload] = useState<any>(null);

    const fetchCatalog = () => {
        return AjaxGet<CatalogResponse>({ url: "/api/quizlet/groups" }).then((json) => {
            setGroups(json.groups);
            setSubgroups(json.subgroups);
            setSubgroupWords(json.subgroup_words);
            setWords(json.words);
        });
    };

    const fetchPersonal = () => {
        return AjaxGet<PersonalResponse>({ url: "/api/quizlet/personal" }).then((json) => {
            setPersonalLesson(json.lesson);
            setPersonalSubgroups(json.subgroups);
        });
    };

    const loadData = () => {
        setLoadStatus(LoadStatus.LOADING);
        Promise.all([fetchCatalog(), fetchPersonal()])
            .then(() => setLoadStatus(LoadStatus.DONE))
            .catch(() => setLoadStatus(LoadStatus.ERROR));
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadSession = (sessionId: number) => {
        AjaxGet<SessionResponse>({ url: `/api/quizlet/sessions/${sessionId}` })
            .then((json) => {
                setSession(json.session);
                setSessionWords(json.words);
            })
            .catch(() => {
                setSession(null);
                setSessionWords([]);
            });
    };

    const queue = useMemo(() => {
        if (session === null) {
            return [] as number[];
        }
        return parseQueue(session as any);
    }, [session]);

    const startSession = (payload: any) => {
        setLastStartPayload(payload);
        AjaxPost<{ session: TQuizletSession }>({ url: "/api/quizlet/sessions/start", body: payload }).then((json) => {
            loadSession(json.session.id);
        });
    };

    const endNow = () => {
        if (session === null) {
            return;
        }
        AjaxPost<{ session: TQuizletSession }>({
            url: `/api/quizlet/sessions/${session.id}/end`,
            body: { force_finish: true },
        }).then((json) => {
            setSession({ ...json.session, is_finished: true });
            loadSession(json.session.id);
        });
    };

    const retryIncorrect = () => {
        if (session === null) {
            return;
        }
        AjaxPost<{ session: TQuizletSession }>({
            url: "/api/quizlet/sessions/retry-incorrect",
            body: { source_session_id: session.id },
        }).then((json) => loadSession(json.session.id));
    };

    const retryAll = () => {
        if (lastStartPayload !== null) {
            startSession(lastStartPayload);
        }
    };

    const submitPairAttempt = async (leftWordId: number, rightWordId: number) => {
        if (session === null) {
            return false;
        }

        try {
            const response = await AjaxPost<{ is_correct: boolean }>({
                url: `/api/quizlet/sessions/${session.id}/pair-attempt`,
                body: {
                    left_word_id: leftWordId,
                    right_word_id: rightWordId,
                },
            });
            loadSession(session.id);
            return response.is_correct;
        } catch {
            return false;
        }
    };

    const submitFlashcard = async (wordId: number, recognized: boolean) => {
        if (session === null) {
            return;
        }

        await AjaxPost({
            url: `/api/quizlet/sessions/${session.id}/flashcard-answer`,
            body: {
                session_word_id: wordId,
                recognized,
            },
        });
        loadSession(session.id);
    };

    const ensurePersonalLesson = () => {
        if (newLessonTitle.trim().length === 0) {
            return;
        }

        const endpoint = "/api/quizlet/personal";
        const method = personalLesson === null ? AjaxPost : AjaxPatch;

        method({ url: endpoint, body: { title: newLessonTitle } }).then(() => {
            setNewLessonTitle("");
            fetchPersonal();
        });
    };

    const addPersonalSubgroup = () => {
        if (newSubgroupTitle.trim().length === 0) {
            return;
        }

        AjaxPost({ url: "/api/quizlet/personal/subgroups", body: { title: newSubgroupTitle } }).then(() => {
            setNewSubgroupTitle("");
            fetchPersonal();
        });
    };

    const addPersonalWord = () => {
        if (newWord.subgroup_id <= 0 || newWord.word_jp.trim().length === 0 || newWord.ru.trim().length === 0) {
            return;
        }

        AjaxPost({ url: "/api/quizlet/personal/words", body: newWord }).then(() => {
            setNewWord({ subgroup_id: 0, char_jp: "", word_jp: "", ru: "" });
            fetchPersonal();
        });
    };

    const finishAndBackToStart = () => {
        setSession(null);
        setSessionWords([]);
    };

    useEffect(() => {
        if (session === null || session.is_finished) {
            return;
        }

        const intervalId = setInterval(() => {
            const sessionQueue = parseQueue(session as any);
            AjaxPost({
                url: `/api/quizlet/sessions/${session.id}/save-progress`,
                body: { queue: sessionQueue },
            }).catch(() => undefined);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [session]);

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить Quizlet"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return <Loading />;
    }

    const unresolvedCount = sessionWords.filter((word) => !word.is_correct).length;

    return (
        <div className="container">
            <PageTitle title="Quizlet" />

            {session === null && (
                <>
                    <QuizletQuizStart
                        groups={groups}
                        subgroups={subgroups}
                        personalLesson={personalLesson}
                        personalSubgroups={personalSubgroups}
                        onStart={startSession}
                    />

                    <div className="card p-3 p-md-4 mt-3">
                        <h4 className="mb-3">Личный словарь</h4>

                        <div className="mb-3">
                            <label className="form-label">Название личного урока</label>
                            <div className="d-flex gap-2">
                                <input
                                    className="form-control"
                                    value={newLessonTitle}
                                    onChange={(e) => setNewLessonTitle(e.target.value)}
                                    placeholder={personalLesson?.title ?? "Например: Мой словарь"}
                                />
                                <button className="btn btn-outline-primary" onClick={ensurePersonalLesson}>
                                    {personalLesson === null ? "Создать" : "Обновить"}
                                </button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Новая подгруппа</label>
                            <div className="d-flex gap-2">
                                <input
                                    className="form-control"
                                    value={newSubgroupTitle}
                                    onChange={(e) => setNewSubgroupTitle(e.target.value)}
                                    placeholder="Название подгруппы"
                                />
                                <button className="btn btn-outline-primary" onClick={addPersonalSubgroup}>
                                    Добавить
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Добавить слово</label>
                            <div className="row g-2">
                                <div className="col-12 col-md-3">
                                    <select
                                        className="form-select"
                                        value={newWord.subgroup_id}
                                        onChange={(e) =>
                                            setNewWord({ ...newWord, subgroup_id: Number(e.target.value) })
                                        }
                                    >
                                        <option value={0}>Выберите подгруппу</option>
                                        {personalSubgroups.map((subgroup) => (
                                            <option key={subgroup.id} value={subgroup.id}>
                                                {subgroup.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-2">
                                    <input
                                        className="form-control"
                                        value={newWord.char_jp}
                                        onChange={(e) => setNewWord({ ...newWord, char_jp: e.target.value })}
                                        placeholder="char_jp"
                                    />
                                </div>
                                <div className="col-12 col-md-3">
                                    <input
                                        className="form-control"
                                        value={newWord.word_jp}
                                        onChange={(e) => setNewWord({ ...newWord, word_jp: e.target.value })}
                                        placeholder="word_jp"
                                    />
                                </div>
                                <div className="col-12 col-md-3">
                                    <input
                                        className="form-control"
                                        value={newWord.ru}
                                        onChange={(e) => setNewWord({ ...newWord, ru: e.target.value })}
                                        placeholder="ru"
                                    />
                                </div>
                                <div className="col-12 col-md-1 d-grid">
                                    <button className="btn btn-outline-primary" onClick={addPersonalWord}>
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {session !== null && (
                <div className="card p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <strong>
                            Прогресс: {session.correct_answers}/{session.total_words} | Ошибок:{" "}
                            {session.incorrect_answers} | Осталось: {unresolvedCount} | Время:{" "}
                            {formatDuration(session.elapsed_seconds)}
                        </strong>
                        {!session.is_finished && (
                            <button className="btn btn-outline-danger" onClick={endNow}>
                                Закончить тренировку
                            </button>
                        )}
                    </div>

                    {!session.is_finished && session.quiz_type === "pair" && (
                        <MatchingExercise
                            words={sessionWords}
                            showHints={session.show_hints}
                            onAttempt={submitPairAttempt}
                        />
                    )}

                    {!session.is_finished && session.quiz_type === "flashcards" && (
                        <FlashcardExercise
                            words={sessionWords}
                            queue={queue}
                            showHints={session.show_hints}
                            direction={session.translation_direction}
                            onAnswer={submitFlashcard}
                        />
                    )}

                    {!session.is_finished && unresolvedCount === 0 && (
                        <div className="mt-3">
                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    AjaxPost<{ session: TQuizletSession }>({
                                        url: `/api/quizlet/sessions/${session.id}/end`,
                                        body: { force_finish: false },
                                    }).then(() => loadSession(session.id));
                                }}
                            >
                                Завершить и показать результат
                            </button>
                        </div>
                    )}

                    {session.is_finished && (
                        <QuizletSessionResults
                            correct={session.correct_answers}
                            incorrect={session.incorrect_answers}
                            skipped={session.skipped_words}
                            elapsedSeconds={session.elapsed_seconds}
                            onRetryAll={retryAll}
                            onRetryIncorrect={retryIncorrect}
                            onFinish={finishAndBackToStart}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentQuizlet;
