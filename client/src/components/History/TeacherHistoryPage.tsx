import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Loading from "components/Common/Loading";
import ShowMoreButton from "components/Common/ShowMoreButton";
import ErrorPage from "components/ErrorPages/ErrorPage";
import {
    getQuizletTags,
    splitDateTime,
    TEACHER_ACTIVITY_TYPE_META,
    TeacherActivityMetric,
    TeacherActivityTypeMeta,
} from "components/Notifications/teacherActivity";
import TeacherActivityCard from "components/Notifications/TeacherActivityCard";
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

const getStudentLabel = (student: TTeacherHistoryStudent) => {
    const hiddenSuffix = student.is_hidden ? " [скрыт]" : "";
    return `${student.nickname} (${student.name})${hiddenSuffix}`;
};

const getTypeMeta = (item: TTeacherHistoryEvent): TeacherActivityTypeMeta => {
    if (item.training_kind === "quizlet" || item.training_kind === "dictionary") {
        return TEACHER_ACTIVITY_TYPE_META[item.training_kind];
    }

    return (
        TEACHER_ACTIVITY_TYPE_META[item.action_type as keyof typeof TEACHER_ACTIVITY_TYPE_META] ??
        TEACHER_ACTIVITY_TYPE_META.assessment_try
    );
};

/** Заголовок как в уведомлениях; у Quizlet — с числом выданных слов. */
const getTitle = (item: TTeacherHistoryEvent) => {
    if (item.training_kind !== "quizlet") {
        return item.target_name;
    }

    const title = item.is_assignment ? item.target_name : "Самостоятельная тренировка";
    return item.total_words !== null && item.total_words !== undefined ? `${title} (${item.total_words})` : title;
};

const getDetails = (item: TTeacherHistoryEvent) => {
    if (item.training_kind === "dictionary") {
        return { iconClass: "bi-pencil", text: item.action_label };
    }

    if (item.training_kind === "quizlet" && (item.topic_titles?.length ?? 0) > 0) {
        return { iconClass: "bi-list-stars", text: item.topic_titles?.join(", ") ?? "" };
    }

    return null;
};

/** Показатели в том же порядке, что в уведомлениях: когда и сколько длилось, затем результат. */
const getMetrics = (item: TTeacherHistoryEvent): TeacherActivityMetric[] => {
    const created = splitDateTime(item.created_at);

    if (item.training_kind === "dictionary") {
        return [
            { iconClass: "bi-calendar3", label: "Дата", value: created.date },
            { iconClass: "bi-clock", label: "Время", value: created.time },
        ];
    }

    const started = splitDateTime(item.started_at);
    const metrics: TeacherActivityMetric[] = [
        { iconClass: "bi-calendar3", label: "Дата", value: splitDateTime(item.completed_at ?? item.created_at).date },
        item.started_at
            ? { iconClass: "bi-play-circle", label: "Начало", value: started.time }
            : { iconClass: "bi-clock", label: "Время", value: created.time },
    ];

    const isHomework = item.action_type === "homework_try";
    if (item.training_kind !== "quizlet" && !isHomework) {
        metrics.push({ iconClass: "bi-exclamation-circle", label: "Ошибки", value: `${item.mistakes_count ?? "-"}` });
        return metrics;
    }

    metrics.push(
        {
            iconClass: "bi-stopwatch",
            label: isHomework ? "Выполнение" : "Время",
            value:
                item.elapsed_seconds !== null && item.elapsed_seconds !== undefined
                    ? formatDuration(item.elapsed_seconds)
                    : "-",
        },
        { iconClass: "bi-exclamation-circle", label: "Ошибки", value: `${item.mistakes_count ?? "-"}` },
        { iconClass: "bi-check-circle", label: "Верно", value: `${item.correct_answers ?? "-"}` },
    );

    if (item.training_kind === "quizlet") {
        metrics.push({ iconClass: "bi-dash-circle", label: "Пропущено", value: `${item.skipped_words ?? "-"}` });
    }

    return metrics;
};

const HistoryItem = ({ item }: { item: TTeacherHistoryEvent }) => {
    const navigate = useNavigate();
    const targetUrl = item.target_url;

    return (
        <div className={styles.historyCard}>
            <TeacherActivityCard
                typeMeta={getTypeMeta(item)}
                tags={
                    item.training_kind === "quizlet" ? getQuizletTags(item.quiz_type, item.translation_direction) : []
                }
                state={item.training_kind === "quizlet" && !item.completed_at ? "Не завершено" : null}
                title={getTitle(item)}
                studentLabel={getStudentLabel(item.student)}
                details={getDetails(item)}
                metrics={getMetrics(item)}
                onOpen={targetUrl ? () => navigate(targetUrl) : undefined}
            />
        </div>
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

        const visibleStudents = sortedStudents.filter((student) => !student.is_hidden);
        const hiddenStudents = sortedStudents.filter((student) => student.is_hidden);

        return (
            <>
                {visibleStudents.length > 0 && (
                    <div className={styles.studentsCompactGrid}>{visibleStudents.map(renderStudentCard)}</div>
                )}
                {hiddenStudents.length > 0 && (
                    <>
                        <div className={styles.hiddenStudentsTitle}>
                            <i className="bi bi-eye-slash" aria-hidden="true"></i>
                            Скрытые ученики
                        </div>
                        <div className={styles.studentsCompactGrid}>{hiddenStudents.map(renderStudentCard)}</div>
                    </>
                )}
            </>
        );
    };

    const renderStudentCard = (student: TTeacherHistoryStudentWithCount) => {
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
                    <div className={`${styles.studentNick} ${student.is_hidden ? styles.studentNickHidden : ""}`}>
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
                <div className={`${styles.studentName} ${student.is_hidden ? styles.studentNameHidden : ""}`}>
                    {student.name}
                </div>
            </button>
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
