import { TAnyNotifications, TStudentNotification } from "models/TNotification";
import { TQuizletAssignment, TQuizletAssignmentResult, TQuizletAssignmentTarget } from "models/TQuizlet";
import { RootState } from "redux/store";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TStudentQuizletAssignmentRecord {
    assignment: TQuizletAssignment;
    target: TQuizletAssignmentTarget;
    result: TQuizletAssignmentResult | null;
    active_session_id: number | null;
}

export interface NotificationsHubState {
    notifications: TAnyNotifications;
    notificationsStatus: "idle" | "loading" | "done" | "error";
    quizletAssignments: TStudentQuizletAssignmentRecord[];
    quizletAssignmentsStatus: "idle" | "loading" | "done" | "error";
    lastLoadedAt: number | null;
}

export interface THubAssignmentItem {
    id: string;
    title: string;
    typeLabel: string;
    buttonLabel: string;
    status: "pending" | "completed";
    kind: "lesson" | "assessment_try" | "final_boss_try" | "quizlet_assignment";
    lessonId?: number;
    activityBaseId?: number;
    assignmentId?: number;
    sortDate: string | null;
    startedAt?: string | null;
    elapsedSeconds?: number | null;
    mistakesCount?: number | null;
    correctAnswersCount?: number | null;
    skippedWordsCount?: number | null;
}

export interface THubStats {
    reviewWords: number;
    reviewSeconds: number;
    testsCompleted: number;
    testsSeconds: number;
}

export interface TAssignmentsHubViewModel {
    pendingItems: THubAssignmentItem[];
    completedItems: THubAssignmentItem[];
    stats: THubStats;
}

const initialState: NotificationsHubState = {
    notifications: [],
    notificationsStatus: "idle",
    quizletAssignments: [],
    quizletAssignmentsStatus: "idle",
    lastLoadedAt: null,
};

const parseDate = (value?: string | null) => {
    if (!value) {
        return null;
    }

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
};

const getElapsedSeconds = (start?: string | null, end?: string | null) => {
    const startTimestamp = parseDate(start);
    const endTimestamp = parseDate(end);

    if (startTimestamp === null || endTimestamp === null || endTimestamp < startTimestamp) {
        return 0;
    }

    return Math.round((endTimestamp - startTimestamp) / 1000);
};

const sortByDateDesc = (left: THubAssignmentItem, right: THubAssignmentItem) => {
    return (parseDate(right.sortDate) ?? 0) - (parseDate(left.sortDate) ?? 0);
};

const dedupeAssignmentItems = (items: THubAssignmentItem[]) => {
    const itemsById = new Map<string, THubAssignmentItem>();

    items.forEach((item) => {
        const existingItem = itemsById.get(item.id);

        if (!existingItem || sortByDateDesc(item, existingItem) < 0) {
            itemsById.set(item.id, item);
        }
    });

    return [...itemsById.values()].sort(sortByDateDesc);
};

const buildAssignmentsHubViewModel = (
    notifications: TAnyNotifications,
    quizletAssignments: TStudentQuizletAssignmentRecord[],
): TAssignmentsHubViewModel => {
    const studentNotifications = (notifications as TStudentNotification[]).filter((item) => item.deleted !== true);

    const latestLessonNotifications = new Map<number, THubAssignmentItem>();
    studentNotifications
        .filter((item) => item.type === "lesson")
        .forEach((item) => {
            const nextItem: THubAssignmentItem = {
                id: `lesson_${item.lesson_id}`,
                title: item.lesson.name,
                typeLabel: "Тест",
                buttonLabel: "Начать",
                status: "pending",
                kind: "lesson",
                lessonId: item.lesson_id,
                sortDate: item.creation_datetime,
            };
            const prevItem = latestLessonNotifications.get(item.lesson_id);
            if (!prevItem || sortByDateDesc(nextItem, prevItem) < 0) {
                latestLessonNotifications.set(item.lesson_id, nextItem);
            }
        });

    const completedTestItems = dedupeAssignmentItems(
        studentNotifications
            .filter((item) => item.type === "assessment_try" || item.type === "final_boss_try")
            .map<THubAssignmentItem>((item) => ({
                id: `${item.type}_${item.activity_try_id}`,
                title: item.lesson.name,
                typeLabel: "Тест",
                buttonLabel: item.type === "assessment_try" ? "Пройти снова" : "Открыть урок",
                status: "completed",
                kind: item.type,
                lessonId: item.lesson.id,
                activityBaseId: item.activity_try.base_id,
                sortDate: item.activity_try.end_datetime || item.creation_datetime,
                startedAt: item.activity_try.start_datetime,
                elapsedSeconds:
                    item.activity_try.start_datetime && item.activity_try.end_datetime
                        ? Math.max(
                              0,
                              Math.round(
                                  ((parseDate(item.activity_try.end_datetime) ?? 0) -
                                      (parseDate(item.activity_try.start_datetime) ?? 0)) /
                                      1000,
                              ),
                          )
                        : null,
                mistakesCount: item.activity_try.mistakes_count,
                correctAnswersCount: item.activity_try.correct_answers ?? null,
            })),
    );

    const completedTestLessonIds = new Set(
        completedTestItems
            .map((item) => item.lessonId)
            .filter((lessonId): lessonId is number => lessonId !== undefined),
    );

    const pendingReviewItems = dedupeAssignmentItems(
        quizletAssignments
            .filter((item) => item.result === null)
            .map<THubAssignmentItem>((item) => ({
                id: `quizlet_${item.assignment.id}`,
                title: item.assignment.title,
                typeLabel: "Повторение слов",
                buttonLabel: "Начать",
                status: "pending",
                kind: "quizlet_assignment",
                assignmentId: item.assignment.id,
                sortDate: item.target.assigned_at,
            })),
    );

    const completedReviewItems = dedupeAssignmentItems(
        quizletAssignments
            .filter((item) => item.result !== null)
            .map<THubAssignmentItem>((item) => ({
                id: `quizlet_${item.assignment.id}`,
                title: item.assignment.title,
                typeLabel: "Повторение слов",
                buttonLabel: "Повторить",
                status: "completed",
                kind: "quizlet_assignment",
                assignmentId: item.assignment.id,
                sortDate: item.result?.completed_at || item.target.completed_at,
                startedAt: item.target.assigned_at,
                elapsedSeconds: item.result?.elapsed_seconds ?? null,
                mistakesCount: item.result?.incorrect_answers ?? null,
                correctAnswersCount: item.result?.correct_answers ?? null,
                skippedWordsCount: item.result?.skipped_words ?? null,
            })),
    );

    const pendingLessonItems = [...latestLessonNotifications.values()].filter(
        (item) => item.lessonId === undefined || !completedTestLessonIds.has(item.lessonId),
    );

    const pendingItems = dedupeAssignmentItems([...pendingLessonItems, ...pendingReviewItems]);
    const completedItems = dedupeAssignmentItems([...completedTestItems, ...completedReviewItems]);

    const stats: THubStats = {
        reviewWords: quizletAssignments.reduce((sum, item) => sum + (item.result?.total_words ?? 0), 0),
        reviewSeconds: quizletAssignments.reduce((sum, item) => sum + (item.result?.elapsed_seconds ?? 0), 0),
        testsCompleted: completedTestItems.length,
        testsSeconds: studentNotifications
            .filter((item) => item.type === "assessment_try" || item.type === "final_boss_try")
            .reduce(
                (sum, item) =>
                    sum + getElapsedSeconds(item.activity_try.start_datetime, item.activity_try.end_datetime),
                0,
            ),
    };

    return {
        pendingItems,
        completedItems,
        stats,
    };
};

export const notificationsHubSlice = createSlice({
    name: "notificationsHub",
    initialState,
    reducers: {
        setNotificationsHubLoading: (state) => {
            state.notificationsStatus = "loading";
            state.quizletAssignmentsStatus = "loading";
        },
        setNotificationsHubData: (
            state,
            action: PayloadAction<{
                notifications: TAnyNotifications;
                quizletAssignments: TStudentQuizletAssignmentRecord[];
                loadedAt: number;
            }>,
        ) => {
            state.notifications = action.payload.notifications;
            state.quizletAssignments = action.payload.quizletAssignments;
            state.notificationsStatus = "done";
            state.quizletAssignmentsStatus = "done";
            state.lastLoadedAt = action.payload.loadedAt;
        },
        setNotificationsHubError: (state) => {
            state.notificationsStatus = "error";
            state.quizletAssignmentsStatus = "error";
        },
        resetNotificationsHub: () => initialState,
    },
});

export const selectNotificationsHub = (state: RootState) => state.notificationsHub;
export const selectHubNotifications = (state: RootState) => state.notificationsHub.notifications;
export const selectStudentAssignmentsHub = (state: RootState) =>
    buildAssignmentsHubViewModel(state.notificationsHub.notifications, state.notificationsHub.quizletAssignments);

export const { setNotificationsHubLoading, setNotificationsHubData, setNotificationsHubError, resetNotificationsHub } =
    notificationsHubSlice.actions;

export default notificationsHubSlice.reducer;
