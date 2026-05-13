import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { formatDuration } from "components/Quizlet/quizletUtils";
import { AjaxPost } from "libs/ServerAPI";
import { TUnfinishedLessonItem, TUnfinishedLessonsSummary } from "models/TLesson";
import { useNotificationsHubSync } from "redux/funcs/notificationsHub";
import { useAppSelector } from "redux/hooks";
import {
    selectNotificationsHub,
    selectStudentAssignmentsHub,
    THubAssignmentItem,
} from "redux/slices/notificationsHubSlice";

import styles from "./StyleMainPage.module.css";

type TabKey = "pending" | "completed";

interface AssignmentsHubProps {
    unfinishedSummary?: TUnfinishedLessonsSummary;
    onUnfinishedChanged?: () => void;
}

const formatStartDateTime = (value: string | null): string => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const formatStartDate = (value?: string | null): string => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

const formatElapsedDuration = (startedAt: string, nowTimestamp: number) => {
    const startedTimestamp = new Date(startedAt).getTime();

    if (Number.isNaN(startedTimestamp)) {
        return "-";
    }

    const totalMinutes = Math.max(0, Math.round((nowTimestamp - startedTimestamp) / 60000));

    if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (minutes === 0) {
            return `${hours} ч`;
        }

        return `${hours} ч ${minutes} мин`;
    }

    return `${totalMinutes} мин`;
};

const getActivityPath = (activityType: string, activityId: number): string | null => {
    if (activityType === "drilling") {
        return `/drilling/${activityId}`;
    }
    if (activityType === "hieroglyph") {
        return `/hieroglyph/${activityId}`;
    }
    if (activityType === "assessment") {
        return `/assessment/${activityId}`;
    }
    return null;
};

const formatRoundedDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const roundedMinutes = Math.round(safeSeconds / 60);

    if (roundedMinutes >= 60) {
        const roundedHours = Math.round(roundedMinutes / 60);
        return `${roundedHours} ч`;
    }

    return `${roundedMinutes} мин`;
};

const COMPLETED_ITEMS_PREVIEW_COUNT = 10;

const AssignmentsHub = ({ unfinishedSummary, onUnfinishedChanged }: AssignmentsHubProps) => {
    const navigate = useNavigate();
    const { refreshHub } = useNotificationsHubSync();
    const [activeTab, setActiveTab] = useState<TabKey>("pending");
    const [runningItemId, setRunningItemId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isFinishingUnfinished, setIsFinishingUnfinished] = useState(false);
    const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
    const [showAllCompleted, setShowAllCompleted] = useState(false);

    const { pendingItems, completedItems, stats } = useAppSelector(selectStudentAssignmentsHub);
    const { notificationsStatus, quizletAssignmentsStatus } = useAppSelector(selectNotificationsHub);

    useEffect(() => {
        const timerId = window.setInterval(() => setNowTimestamp(Date.now()), 60_000);

        return () => window.clearInterval(timerId);
    }, []);

    const unfinishedItems: TUnfinishedLessonItem[] = useMemo(() => {
        if (unfinishedSummary === undefined || !unfinishedSummary.has_unfinished_lessons) {
            return [];
        }

        if (unfinishedSummary.items && unfinishedSummary.items.length > 0) {
            return unfinishedSummary.items;
        }

        if (
            unfinishedSummary.next_unfinished_activity_type !== null &&
            unfinishedSummary.next_unfinished_activity_id !== null &&
            unfinishedSummary.next_unfinished_activity_started_at !== null
        ) {
            return [
                {
                    course_name: unfinishedSummary.next_unfinished_course_name ?? "-",
                    lesson_id: unfinishedSummary.next_unfinished_lesson_id ?? 0,
                    lesson_name: unfinishedSummary.next_unfinished_lesson_name ?? "-",
                    activity_type: unfinishedSummary.next_unfinished_activity_type,
                    activity_id: unfinishedSummary.next_unfinished_activity_id,
                    activity_started_at: unfinishedSummary.next_unfinished_activity_started_at,
                },
            ];
        }

        return [];
    }, [unfinishedSummary]);

    const unfinishedLessonIds = new Set(unfinishedItems.map((item) => item.lesson_id));
    const filteredPendingItems = pendingItems.filter(
        (item) => !(item.kind === "lesson" && item.lessonId !== undefined && unfinishedLessonIds.has(item.lessonId)),
    );

    const visibleCompletedItems =
        showAllCompleted || completedItems.length <= COMPLETED_ITEMS_PREVIEW_COUNT
            ? completedItems
            : completedItems.slice(0, COMPLETED_ITEMS_PREVIEW_COUNT);

    const items = activeTab === "pending" ? filteredPendingItems : visibleCompletedItems;
    const isLoading = notificationsStatus === "loading" || quizletAssignmentsStatus === "loading";
    const hasError = notificationsStatus === "error" || quizletAssignmentsStatus === "error";

    useEffect(() => {
        if (activeTab !== "completed") {
            setShowAllCompleted(false);
        }
    }, [activeTab]);

    const openItem = (item: THubAssignmentItem) => {
        if (item.kind === "quizlet_assignment" && item.assignmentId !== undefined) {
            navigate(`/quizlet/assignments/${item.assignmentId}`);
            return;
        }

        if (item.lessonId !== undefined) {
            navigate(`/lessons/${item.lessonId}`);
        }
    };

    const handleAction = (item: THubAssignmentItem) => {
        setActionError(null);

        if (item.kind !== "assessment_try" || item.activityBaseId === undefined) {
            openItem(item);
            return;
        }

        setRunningItemId(item.id);
        AjaxPost({ url: `/api/assessment/${item.activityBaseId}/newtry` })
            .then(() => {
                navigate(`/assessment/${item.activityBaseId}`);
                refreshHub(true);
            })
            .catch(() => {
                setActionError("Не удалось запустить тест повторно");
            })
            .finally(() => {
                setRunningItemId(null);
            });
    };

    const continueUnfinished = (item: TUnfinishedLessonItem) => {
        const path = getActivityPath(item.activity_type, item.activity_id);

        if (!path) {
            return;
        }

        AjaxPost({ url: `/api/${item.activity_type}/${item.activity_id}/continuetry` })
            .then(() => {
                navigate(path);
            })
            .catch(() => {
                setActionError("Не удалось продолжить тест");
            });
    };

    const finishUnfinished = (item: TUnfinishedLessonItem) => {
        if (isFinishingUnfinished) {
            return;
        }

        setActionError(null);
        setIsFinishingUnfinished(true);
        AjaxPost({
            url: "/api/activities/unfinished/end",
            body: {
                activity_type: item.activity_type,
                activity_id: item.activity_id,
            },
        })
            .then(() => {
                onUnfinishedChanged?.();
                refreshHub(true);
            })
            .catch(() => {
                setActionError("Не удалось завершить тест");
            })
            .finally(() => {
                setIsFinishingUnfinished(false);
            });
    };

    return (
        <section className={styles.assignmentsSection}>
            <div className={styles.assignmentsShell}>
                <div className={styles.assignmentsMain}>
                    <div className={styles.assignmentsHeader}>
                        <div>
                            <h2 className={styles.sectionTitle}>Задания</h2>
                            <p className={styles.sectionSubtitle}>Все назначенные задания собраны в одном месте.</p>
                        </div>
                        <div className={styles.tabsRow}>
                            <button
                                type="button"
                                className={`${styles.tabButton} ${activeTab === "pending" ? styles.tabButtonActive : ""}`}
                                onClick={() => setActiveTab("pending")}
                            >
                                Не выполнено
                                <span className={styles.tabCounter}>{pendingItems.length}</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.tabButton} ${activeTab === "completed" ? styles.tabButtonActive : ""}`}
                                onClick={() => setActiveTab("completed")}
                            >
                                Выполнено
                                <span className={styles.tabCounter}>{completedItems.length}</span>
                            </button>
                        </div>
                    </div>

                    {actionError ? <div className="alert alert-warning mb-3">{actionError}</div> : null}

                    <div className={styles.assignmentsBody}>
                        <div className={styles.assignmentsList}>
                            {isLoading && items.length === 0 ? (
                                <div className={styles.emptyState}>Загрузка заданий...</div>
                            ) : null}
                            {hasError && items.length === 0 ? (
                                <div className={styles.emptyState}>Не удалось загрузить задания.</div>
                            ) : null}

                            {activeTab === "pending"
                                ? unfinishedItems.map((item) => (
                                      <article
                                          key={`unfinished_${item.activity_type}_${item.activity_id}`}
                                          className={`${styles.assignmentCard} ${styles.assignmentCardActive}`}
                                      >
                                          <div className={styles.assignmentInfo}>
                                              <div className={styles.assignmentTitle}>{item.lesson_name}</div>
                                              <div className={styles.assignmentType}>Тест</div>
                                              <div className={styles.assignmentMeta}>
                                                  <span>Начало: {formatStartDateTime(item.activity_started_at)}</span>
                                                  <span>
                                                      В тесте:{" "}
                                                      {formatElapsedDuration(item.activity_started_at, nowTimestamp)}
                                                  </span>
                                              </div>
                                          </div>
                                          <div className={styles.assignmentActions}>
                                              <button
                                                  type="button"
                                                  className="btn btn-warning"
                                                  onClick={() => continueUnfinished(item)}
                                                  disabled={isFinishingUnfinished}
                                              >
                                                  Продолжить
                                              </button>
                                              <button
                                                  type="button"
                                                  className="btn btn-outline-danger"
                                                  onClick={() => finishUnfinished(item)}
                                                  disabled={isFinishingUnfinished}
                                              >
                                                  Завершить
                                              </button>
                                          </div>
                                      </article>
                                  ))
                                : null}

                            {items.map((item) => (
                                <article key={item.id} className={styles.assignmentCard}>
                                    <div className={styles.assignmentInfo}>
                                        <div className={styles.assignmentTitle}>{item.title}</div>
                                        <div className={styles.assignmentType}>{item.typeLabel}</div>
                                        {activeTab === "completed" ? (
                                            <div className={styles.assignmentResultGrid}>
                                                <div className={styles.assignmentResultItem}>
                                                    <i className="bi bi-calendar3" aria-hidden="true" />
                                                    <span>{formatStartDate(item.startedAt)}</span>
                                                </div>
                                                <div className={styles.assignmentResultItem}>
                                                    <i className="bi bi-clock" aria-hidden="true" />
                                                    <span>
                                                        {item.elapsedSeconds !== null &&
                                                        item.elapsedSeconds !== undefined
                                                            ? formatDuration(item.elapsedSeconds)
                                                            : "-"}
                                                    </span>
                                                </div>
                                                <div className={styles.assignmentResultItem}>
                                                    <i className="bi bi-x-lg" aria-hidden="true" />
                                                    <span>{item.mistakesCount ?? "-"}</span>
                                                </div>
                                                <div className={styles.assignmentResultItem}>
                                                    <i className="bi bi-check-lg" aria-hidden="true" />
                                                    <span>{item.correctAnswersCount ?? "-"}</span>
                                                </div>
                                                {item.kind === "quizlet_assignment" ? (
                                                    <div className={styles.assignmentResultItem}>
                                                        <i className="bi bi-hourglass-split" aria-hidden="true" />
                                                        <span>{item.skippedWordsCount ?? "-"}</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-warning"
                                        onClick={() => handleAction(item)}
                                        disabled={runningItemId === item.id}
                                    >
                                        {runningItemId === item.id ? "Открываем..." : item.buttonLabel}
                                    </button>
                                </article>
                            ))}

                            {activeTab === "completed" && completedItems.length > COMPLETED_ITEMS_PREVIEW_COUNT ? (
                                <button
                                    type="button"
                                    className={`btn btn-outline-secondary ${styles.showAllButton}`}
                                    onClick={() => setShowAllCompleted((prev) => !prev)}
                                >
                                    {showAllCompleted ? "Скрыть" : "Посмотреть всё"}
                                </button>
                            ) : null}
                        </div>

                        <aside className={styles.statsCard}>
                            <div className={styles.statsGroup}>
                                <div className={styles.statsTitle}>Статистика ワードラボ</div>
                                <div className={styles.statRow}>
                                    <span>Повторено</span>
                                    <strong>{stats.reviewWords} слов</strong>
                                </div>
                                <div className={styles.statRow}>
                                    <span>Время</span>
                                    <strong>{formatRoundedDuration(stats.reviewSeconds)}</strong>
                                </div>
                            </div>

                            <div className={styles.statsDivider} />

                            <div className={styles.statsGroup}>
                                <div className={styles.statsTitle}>Статистика тестов</div>
                                <div className={styles.statRow}>
                                    <span>Выполнено</span>
                                    <strong>{stats.testsCompleted} тестов</strong>
                                </div>
                                <div className={styles.statRow}>
                                    <span>Время</span>
                                    <strong>{formatRoundedDuration(stats.testsSeconds)}</strong>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AssignmentsHub;
