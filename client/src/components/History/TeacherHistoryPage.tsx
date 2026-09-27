import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Loading from "components/Common/Loading";
import ShowMoreButton from "components/Common/ShowMoreButton";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { formatDuration } from "components/Quizlet/quizletUtils";
import { AjaxGet } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { useCursorPagedList } from "libs/useCursorPagedList";
import {
    TTeacherHistoryEvent,
    TTeacherHistoryStudent,
    TTeacherHistoryStudentsResponse,
    TTeacherHistoryStudentWithCount,
} from "models/TTeacherHistory";

import styles from "./TeacherHistoryPage.module.css";

type HistoryTab = "all" | "students";
const HISTORY_PAGE_SIZE = 20;

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

const getStudentTitleLabel = (student: TTeacherHistoryStudent) => {
    const hiddenSuffix = student.is_hidden ? " [скрыт]" : "";
    return `${student.name} (${student.nickname})${hiddenSuffix}`;
};

const lowerFirst = (value: string) => {
    if (value.length === 0) {
        return value;
    }

    return value[0].toLowerCase() + value.slice(1);
};

const splitDictionaryTargetName = (targetName: string) => {
    const [dictionaryTitle, ...topicParts] = targetName.split(" • ");

    return {
        dictionaryTitle,
        topicTitle: topicParts.join(" • "),
    };
};

const getHistoryCardTitle = (item: TTeacherHistoryEvent) => {
    const studentLabel = getStudentTitleLabel(item.student);

    if (item.training_kind === "test") {
        return `${studentLabel} ・ тест ${item.target_name.toUpperCase()}`;
    }

    if (item.training_kind === "quizlet") {
        if (item.quiz_type === "flashcards") {
            return `${studentLabel} ・ ${getDirectionLabel(item.translation_direction)} (${item.total_words ?? "-"})`;
        }

        if (item.quiz_type === "pair") {
            return `${studentLabel} ・ пары (${item.total_words ?? "-"})`;
        }

        return `${studentLabel} ・ quizlet`;
    }

    if (item.training_kind === "dictionary") {
        const { dictionaryTitle, topicTitle } = splitDictionaryTargetName(item.target_name);

        if (item.action_type === "personal_dictionary_updated") {
            return `${studentLabel}・изменил (${dictionaryTitle})`;
        }

        if (item.action_type === "personal_dictionary_topic_created") {
            return `${studentLabel}・создал (${topicTitle || item.target_name})`;
        }

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

const HistoryItem = ({ item }: HistoryItemProps) => {
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
    const [activeTab, setActiveTab] = useState<HistoryTab>("all");
    const [students, setStudents] = useState<
        LoadStatus.DataDoneOrNotDone<{ items: TTeacherHistoryStudentWithCount[] }>
    >({ loadStatus: LoadStatus.LOADING });

    const selectedStudentId = useMemo(() => {
        if (!params.studentId) {
            return null;
        }

        const value = Number(params.studentId);
        return Number.isInteger(value) ? value : null;
    }, [params.studentId]);

    const isStudentDetailsPage = selectedStudentId !== null;

    const historyUrlParams = useMemo(
        () => (selectedStudentId !== null ? { student_id: selectedStudentId } : undefined),
        [selectedStudentId],
    );
    const history = useCursorPagedList<TTeacherHistoryEvent, "history">({
        url: "/api/notifications/history",
        itemsKey: "history",
        pageSize: HISTORY_PAGE_SIZE,
        urlParams: historyUrlParams,
    });

    useEffect(() => {
        AjaxGet<TTeacherHistoryStudentsResponse>({ url: "/api/notifications/history/students" })
            .then((json) => {
                setStudents({ loadStatus: LoadStatus.DONE, items: json.students });
            })
            .catch(() => {
                setStudents({ loadStatus: LoadStatus.ERROR });
            });
    }, []);

    const sortedStudents = useMemo(() => {
        if (students.loadStatus !== LoadStatus.DONE) {
            return [];
        }

        return [...students.items].sort(
            (left, right) => right.actions_count - left.actions_count || left.nickname.localeCompare(right.nickname),
        );
    }, [students]);

    const selectedStudent = useMemo(() => {
        if (selectedStudentId === null || students.loadStatus !== LoadStatus.DONE) {
            return null;
        }

        return students.items.find((student) => student.id === selectedStudentId) ?? null;
    }, [selectedStudentId, students]);

    if (history.loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить историю учеников"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    const renderHistoryList = (emptyText: string) => {
        if (history.loadStatus !== LoadStatus.DONE) {
            return <Loading />;
        }

        if (history.items.length === 0) {
            return <div className={styles.emptyState}>{emptyText}</div>;
        }

        return (
            <div className={styles.historyList}>
                {history.items.map((item) => (
                    <HistoryItem key={item.id} item={item} />
                ))}
                <ShowMoreButton
                    hasMore={history.hasMore}
                    isLoading={history.isLoadingMore}
                    isError={history.isLoadMoreError}
                    onClick={history.loadMore}
                    className={styles.showMoreRow}
                />
            </div>
        );
    };

    const renderStudents = () => {
        if (students.loadStatus === LoadStatus.ERROR) {
            return <div className={styles.emptyState}>Не удалось загрузить список учеников.</div>;
        }

        if (students.loadStatus !== LoadStatus.DONE) {
            return <Loading />;
        }

        if (sortedStudents.length === 0) {
            return <div className={styles.emptyState}>Пока нет учеников.</div>;
        }

        return (
            <div className={styles.studentsCompactGrid}>
                {sortedStudents.map((student) => {
                    const isActive = student.id === selectedStudentId;
                    const hasActions = student.actions_count > 0;

                    return (
                        <button
                            key={student.id}
                            type="button"
                            className={`${styles.studentCardCompact} ${isActive ? styles.studentCardActive : ""} ${
                                hasActions ? styles.studentCardHighlighted : ""
                            }`}
                            onClick={() => navigate(`/teacher/history/students/${student.id}`)}
                        >
                            <div className={styles.studentCardCompactTopRow}>
                                <div
                                    className={`${styles.studentNick} ${student.is_hidden ? styles.studentNickHidden : ""}`}
                                >
                                    {student.nickname}
                                    {student.is_hidden && (
                                        <span className={styles.studentHiddenBadge}>
                                            <i className="bi bi-eye-slash" aria-hidden="true"></i>
                                            скрыт
                                        </span>
                                    )}
                                </div>
                                <div
                                    className={`${styles.studentActionsBadge} ${
                                        hasActions ? styles.studentActionsBadgeActive : styles.studentActionsBadgeMuted
                                    }`}
                                >
                                    {student.actions_count}
                                </div>
                            </div>
                            <div
                                className={`${styles.studentName} ${student.is_hidden ? styles.studentNameHidden : ""}`}
                            >
                                {student.name}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    if (isStudentDetailsPage) {
        return (
            <div className={`container ${styles.page}`}>
                <div className={styles.header}>
                    <div className={styles.studentDetailsHeader}>
                        <button
                            type="button"
                            className={`btn btn-link ps-0 ${styles.backButton}`}
                            onClick={() => navigate("/teacher/history")}
                        >
                            Назад к ученикам
                        </button>
                        <h1 className={`${styles.title} ${styles.studentDetailsTitle}`}>
                            {selectedStudent
                                ? `История: ${selectedStudent.nickname} (${selectedStudent.name})`
                                : "История ученика"}
                        </h1>
                    </div>
                </div>

                {renderHistoryList(
                    students.loadStatus === LoadStatus.DONE && selectedStudent === null
                        ? "Ученик не найден."
                        : "У этого ученика пока нет действий в истории.",
                )}
            </div>
        );
    }

    return (
        <div className={`container ${styles.page}`}>
            <div className={`${styles.header} ${styles.headerCentered}`}>
                <div className={styles.headerTitleCentered}>
                    <h1 className={styles.title}>История</h1>
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

            {activeTab === "all" ? renderHistoryList("Пока в истории нет действий учеников.") : renderStudents()}
        </div>
    );
};

export default TeacherHistoryPage;
