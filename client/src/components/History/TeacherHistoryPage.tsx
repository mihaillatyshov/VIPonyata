import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { formatDuration } from "components/Quizlet/quizletUtils";
import { AjaxGet } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TTeacherHistoryEvent, TTeacherHistoryResponse } from "models/TTeacherHistory";
import { TUserData } from "models/TUser";

import styles from "./TeacherHistoryPage.module.css";

type HistoryTab = "all" | "students";
const INITIAL_ALL_ACTIONS_COUNT = 15;
const NEXT_ALL_ACTIONS_COUNT = 20;
const INITIAL_STUDENT_ACTIONS_COUNT = 10;
const NEXT_STUDENT_ACTIONS_COUNT = 20;

const getHistoryItemKindClass = (kind: TTeacherHistoryEvent["training_kind"]) => {
    switch (kind) {
        case "quizlet":
            return styles.historyItemQuizlet;
        case "dictionary":
            return styles.historyItemDictionary;
        case "test":
        case "practice":
        default:
            return styles.historyItemTest;
    }
};

const isCompactDictionaryHistoryItem = (item: TTeacherHistoryEvent) => {
    return item.training_kind === "dictionary";
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return "-";
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return value.replace("T", " ").slice(0, 16);
};

const getDirectionLabel = (direction?: string) => {
    return direction === "ru_to_jp" ? "ru-jp" : "jp-ru";
};

const getStudentTitleLabel = (student: TUserData) => {
    return `${student.name} (${student.nickname})`;
};

const lowerFirst = (value: string) => {
    if (value.length === 0) {
        return value;
    }

    return value[0].toLowerCase() + value.slice(1);
};

const getHistoryCardTitle = (item: TTeacherHistoryEvent) => {
    const studentLabel = getStudentTitleLabel(item.student);

    if (item.training_kind === "test") {
        return `${studentLabel} ・ тест ${item.target_name.toUpperCase()}`;
    }

    if (item.training_kind === "quizlet") {
        if (item.quiz_type === "flashcards") {
            return `${studentLabel} ・ флешкарточки (${item.total_words ?? "-"})`;
        }

        if (item.quiz_type === "pair") {
            return `${studentLabel} ・ пары (${item.total_words ?? "-"})`;
        }

        return `${studentLabel} ・ quizlet`;
    }

    if (item.training_kind === "dictionary") {
        return `${studentLabel} ${lowerFirst(item.action_label)} ${item.target_name}`;
    }

    return `${studentLabel} ${lowerFirst(item.action_label)} ${item.target_name}`;
};

const getHistoryCardIconClass = (item: TTeacherHistoryEvent) => {
    if (item.training_kind === "test") {
        return "bi-ui-checks-grid";
    }

    if (item.training_kind === "quizlet") {
        if (item.quiz_type === "pair") {
            return "bi-grid-3x2-gap";
        }

        if (item.quiz_type === "flashcards") {
            return "bi-collection";
        }
    }

    return "bi-bookmark-star";
};

interface HistoryItemProps {
    item: TTeacherHistoryEvent;
    showStudent: boolean;
}

interface HistoryMetaItemProps {
    iconClass: string;
    value: string;
    title: string;
}

const HistoryMetaItem = ({ iconClass, value, title }: HistoryMetaItemProps) => {
    return (
        <div className={styles.metaItem} title={title} aria-label={title}>
            <span className={styles.metaIcon} aria-hidden="true">
                <i className={`bi ${iconClass}`}></i>
            </span>
            <span className={styles.metaValue}>{value}</span>
        </div>
    );
};

const HistoryItem = ({ item, showStudent }: HistoryItemProps) => {
    const navigate = useNavigate();
    const isCompactDictionaryItem = isCompactDictionaryHistoryItem(item);
    const isTestHistoryItem = item.training_kind === "test";
    const hasQuizletTopics = item.training_kind === "quizlet" && (item.topic_titles?.length ?? 0) > 0;

    const titleContent = (
        <>
            <div className={styles.itemTitleRow}>
                <i className={`bi ${getHistoryCardIconClass(item)}`} aria-hidden="true"></i>
                <span className={styles.itemAction}>{getHistoryCardTitle(item)}</span>
                {item.target_url && (
                    <i className={`bi bi-arrow-up-right ${styles.itemTargetLinkIcon}`} aria-hidden="true"></i>
                )}
            </div>
            {hasQuizletTopics && (
                <div className={styles.itemTopicList}>
                    <i className="bi bi-list-stars" aria-hidden="true"></i>
                    <span>{item.topic_titles?.join(", ")}</span>
                </div>
            )}
        </>
    );

    return (
        <article className={`${styles.historyItem} ${getHistoryItemKindClass(item.training_kind)}`}>
            <div className={styles.itemHeader}>
                {item.target_url ? (
                    <button
                        type="button"
                        className={styles.itemHeadingButton}
                        onClick={() => navigate(item.target_url as string)}
                    >
                        {titleContent}
                    </button>
                ) : (
                    <div className={styles.itemHeadingStatic}>{titleContent}</div>
                )}
            </div>

            {isCompactDictionaryItem ? (
                <div className={styles.metaGridCompact}>
                    <HistoryMetaItem iconClass="bi-calendar3" title="Дата" value={formatDateTime(item.created_at)} />
                </div>
            ) : (
                <div className={styles.metaGrid}>
                    <HistoryMetaItem
                        iconClass="bi-box-arrow-right"
                        title="Финиш"
                        value={formatDateTime(item.completed_at)}
                    />
                    <HistoryMetaItem
                        iconClass="bi-stopwatch"
                        title="Время"
                        value={
                            item.elapsed_seconds !== null && item.elapsed_seconds !== undefined
                                ? formatDuration(item.elapsed_seconds)
                                : "-"
                        }
                    />
                    <HistoryMetaItem
                        iconClass="bi-exclamation-triangle"
                        title="Ошибки"
                        value={`${item.mistakes_count ?? "-"}`}
                    />
                    {!isTestHistoryItem && (
                        <HistoryMetaItem iconClass="bi-check2" title="Верно" value={`${item.correct_answers ?? "-"}`} />
                    )}
                    {!isTestHistoryItem && (
                        <HistoryMetaItem
                            iconClass="bi-skip-forward"
                            title="Пропуск"
                            value={`${item.skipped_words ?? "-"}`}
                        />
                    )}
                </div>
            )}
        </article>
    );
};

const TeacherHistoryPage = () => {
    const navigate = useNavigate();
    const params = useParams<{ studentId?: string }>();
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.LOADING);
    const [activeTab, setActiveTab] = useState<HistoryTab>("all");
    const [students, setStudents] = useState<TUserData[]>([]);
    const [history, setHistory] = useState<TTeacherHistoryEvent[]>([]);
    const [visibleAllActionsCount, setVisibleAllActionsCount] = useState<number>(INITIAL_ALL_ACTIONS_COUNT);

    const [visibleStudentActionsCount, setVisibleStudentActionsCount] = useState<number>(INITIAL_STUDENT_ACTIONS_COUNT);

    const selectedStudentId = useMemo(() => {
        if (!params.studentId) {
            return null;
        }

        const value = Number(params.studentId);
        return Number.isInteger(value) ? value : null;
    }, [params.studentId]);

    const isStudentDetailsPage = selectedStudentId !== null;

    useEffect(() => {
        setLoadStatus(LoadStatus.LOADING);
        AjaxGet<TTeacherHistoryResponse>({ url: "/api/notifications/history" })
            .then((json) => {
                setStudents(json.students);
                setHistory(json.history);
                setLoadStatus(LoadStatus.DONE);
            })
            .catch(() => {
                setLoadStatus(LoadStatus.ERROR);
            });
    }, []);

    const studentCounts = useMemo(() => {
        const counts = new Map<number, number>();
        history.forEach((item) => {
            counts.set(item.student.id, (counts.get(item.student.id) ?? 0) + 1);
        });
        return counts;
    }, [history]);

    const studentsWithCounts = useMemo(() => {
        return [...students]
            .map((student) => ({
                ...student,
                actionsCount: studentCounts.get(student.id) ?? 0,
            }))
            .sort(
                (left, right) => right.actionsCount - left.actionsCount || left.nickname.localeCompare(right.nickname),
            );
    }, [studentCounts, students]);

    useEffect(() => {
        if (activeTab === "all") {
            setVisibleAllActionsCount(INITIAL_ALL_ACTIONS_COUNT);
        }
    }, [activeTab]);

    useEffect(() => {
        setVisibleStudentActionsCount(INITIAL_STUDENT_ACTIONS_COUNT);
    }, [selectedStudentId]);

    const selectedStudentHistory = useMemo(() => {
        if (selectedStudentId === null) {
            return [];
        }

        return history.filter((item) => item.student.id === selectedStudentId);
    }, [history, selectedStudentId]);

    const visibleStudentHistory = useMemo(() => {
        return selectedStudentHistory.slice(0, visibleStudentActionsCount);
    }, [selectedStudentHistory, visibleStudentActionsCount]);

    const visibleAllHistory = useMemo(() => {
        return history.slice(0, visibleAllActionsCount);
    }, [history, visibleAllActionsCount]);

    const canShowMoreAllHistory = history.length > visibleAllActionsCount;

    const canShowMoreStudentHistory = selectedStudentHistory.length > visibleStudentActionsCount;

    const selectedStudent = useMemo(() => {
        if (selectedStudentId === null) {
            return null;
        }

        return students.find((student) => student.id === selectedStudentId) ?? null;
    }, [selectedStudentId, students]);

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить историю учеников"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return <Loading />;
    }

    if (isStudentDetailsPage) {
        return (
            <div className={`container ${styles.page}`}>
                <div className={styles.header}>
                    <div>
                        <button
                            type="button"
                            className={`btn btn-link ps-0 ${styles.backButton}`}
                            onClick={() => navigate("/teacher/history")}
                        >
                            Назад к ученикам
                        </button>
                        <h1 className={styles.title}>
                            {selectedStudent
                                ? `История: ${selectedStudent.nickname} (${selectedStudent.name})`
                                : "История ученика"}
                        </h1>
                        <p className={styles.subtitle}>Последние действия выбранного ученика.</p>
                    </div>
                </div>

                {selectedStudentHistory.length > 0 ? (
                    <div className={styles.historyList}>
                        {visibleStudentHistory.map((item) => (
                            <HistoryItem key={item.id} item={item} showStudent={false} />
                        ))}
                        {canShowMoreStudentHistory && (
                            <div className={styles.showMoreRow}>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        setVisibleStudentActionsCount((count) => count + NEXT_STUDENT_ACTIONS_COUNT)
                                    }
                                >
                                    Показать ещё
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        {selectedStudent ? "У этого ученика пока нет действий в истории." : "Ученик не найден."}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`container ${styles.page}`}>
            <div className={`${styles.header} ${styles.headerCentered}`}>
                <div className={styles.headerTitleCentered}>
                    <h1 className={styles.title}>История</h1>
                    {/* <p className={styles.subtitle}>
                        Здесь собраны действия учеников: завершения заданий, попытки Quizlet и работа с личными
                        словарями.
                    </p> */}
                </div>
                <div className={styles.tabsRow} role="tablist" aria-label="Переключение истории">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "all"}
                        className={`${styles.tabButton} ${activeTab === "all" ? styles.tabButtonActive : ""}`}
                        onClick={() => setActiveTab("all")}
                    >
                        Всё
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "students"}
                        className={`${styles.tabButton} ${activeTab === "students" ? styles.tabButtonActive : ""}`}
                        onClick={() => setActiveTab("students")}
                    >
                        По ученикам
                    </button>
                </div>
            </div>

            {activeTab === "all" ? (
                history.length > 0 ? (
                    <div className={styles.historyList}>
                        {visibleAllHistory.map((item) => (
                            <HistoryItem key={item.id} item={item} showStudent={true} />
                        ))}
                        {canShowMoreAllHistory && (
                            <div className={styles.showMoreRow}>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setVisibleAllActionsCount((count) => count + NEXT_ALL_ACTIONS_COUNT)}
                                >
                                    Показать ещё
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyState}>Пока в истории нет действий учеников.</div>
                )
            ) : (
                <>
                    {studentsWithCounts.length > 0 ? (
                        <div className={styles.studentsCompactGrid}>
                            {studentsWithCounts.map((student) => {
                                const isActive = student.id === selectedStudentId;
                                const hasActions = student.actionsCount > 0;

                                return (
                                    <button
                                        key={student.id}
                                        type="button"
                                        className={`${styles.studentCardCompact} ${
                                            isActive ? styles.studentCardActive : ""
                                        } ${hasActions ? styles.studentCardHighlighted : ""}`}
                                        onClick={() => navigate(`/teacher/history/students/${student.id}`)}
                                    >
                                        <div className={styles.studentCardCompactTopRow}>
                                            <div className={styles.studentNick}>{student.nickname}</div>
                                            <div
                                                className={`${styles.studentActionsBadge} ${
                                                    hasActions
                                                        ? styles.studentActionsBadgeActive
                                                        : styles.studentActionsBadgeMuted
                                                }`}
                                            >
                                                {student.actionsCount}
                                            </div>
                                        </div>
                                        <div className={styles.studentName}>{student.name}</div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>Пока нет учеников.</div>
                    )}
                </>
            )}
        </div>
    );
};

export default TeacherHistoryPage;
