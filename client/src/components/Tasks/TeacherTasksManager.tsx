import { useReducer, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { createHomeworkAssignment, tasksKeys, tasksQueries } from "api/tasks";
import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import HomeworkResultPage from "./HomeworkResultPage";
import {
    assignmentWizardReducer,
    DEFAULT_HOMEWORK_TITLE,
    initialAssignmentWizardState,
    isDraftBlocksStructureValid,
} from "./Teacher/assignmentWizard";
import TaskBankSection from "./Teacher/TaskBankSection";
import TasksAssignStep from "./Teacher/TasksAssignStep";
import TasksFinalizeStep from "./Teacher/TasksFinalizeStep";
import TasksHistoryList from "./Teacher/TasksHistoryList";
import { buildDraftTasksFromSelection } from "./Teacher/tasksUtils";

import "components/Quizlet/QuizletShared.css";
import "./TasksShared.css";

type TabKey = "assign" | "bank" | "history";

const TABS: Array<{ key: TabKey; label: string; path: string }> = [
    { key: "assign", label: "Задания", path: "/tasks" },
    { key: "bank", label: "Банк заданий", path: "/tasks/bank" },
    { key: "history", label: "Назначенное", path: "/tasks/history" },
];

const parseTasksRoute = (pathname: string) => {
    const bankLessonMatch = pathname.match(/^\/tasks\/bank\/lessons\/(\d+|unsorted)$/);

    return {
        activeTab: (pathname.startsWith("/tasks/bank")
            ? "bank"
            : pathname.startsWith("/tasks/history")
              ? "history"
              : "assign") as TabKey,
        isTryRoute: pathname.startsWith("/tasks/tries/"),
        isFinalizeRoute: pathname === "/tasks/finalize",
        /** undefined — не страница урока; null — «Нерассортированное». */
        bankLessonId:
            bankLessonMatch === null
                ? undefined
                : bankLessonMatch[1] === "unsorted"
                  ? null
                  : Number(bankLessonMatch[1]),
    };
};

const TeacherTasksManager = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { activeTab, isTryRoute, isFinalizeRoute, bankLessonId } = parseTasksRoute(location.pathname);

    const [wizard, dispatchWizard] = useReducer(assignmentWizardReducer, initialAssignmentWizardState);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const optionsQuery = useQuery({ ...tasksQueries.options(), enabled: !isTryRoute });
    // С выбранным учеником банк показывает, сколько раз он выполнял каждое задание.
    const bankQuery = useQuery({ ...tasksQueries.bank(wizard.studentId), enabled: !isTryRoute });
    const assignmentsQuery = useQuery({ ...tasksQueries.assignments(), enabled: !isTryRoute });

    const createMutation = useMutation({
        mutationFn: createHomeworkAssignment,
        onSuccess: async () => {
            dispatchWizard({ type: "resetAfterCreate" });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: tasksKeys.assignments() }),
                queryClient.invalidateQueries({ queryKey: tasksKeys.bankAll() }),
            ]);
            navigate("/tasks/history");
        },
        onError: () => setErrorMessage("Не удалось назначить задания"),
    });

    if (isTryRoute) {
        return (
            <Routes>
                <Route path="tries/:tryId" element={<HomeworkResultPage />} />
            </Routes>
        );
    }

    if (optionsQuery.isError || bankQuery.isError || assignmentsQuery.isError) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить раздел заданий"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (optionsQuery.isPending || bankQuery.isPending || assignmentsQuery.isPending) {
        return <Loading />;
    }

    const options = optionsQuery.data;
    const bank = bankQuery.data;

    // Выбор и предпросмотр ограничены заданиями выбранных уроков.
    const availableTasks = bank.items.filter((item) => wizard.lessonIds.includes(item.lesson_id ?? -1));
    const availableTaskIds = new Set(availableTasks.map((item) => item.id));
    const selectedTaskIds = wizard.taskIds.filter((id) => availableTaskIds.has(id));

    const confirmSelection = () => {
        if (wizard.studentId === null) {
            setErrorMessage("Выберите ученика");
            return;
        }
        if (wizard.lessonIds.length === 0) {
            setErrorMessage("Выберите хотя бы один урок");
            return;
        }

        const selectedTasks = availableTasks.filter((item) => selectedTaskIds.includes(item.id));
        if (selectedTasks.length === 0) {
            setErrorMessage("Выберите хотя бы одно задание");
            return;
        }

        setErrorMessage(null);
        dispatchWizard({ type: "startFinalize", draftTasks: buildDraftTasksFromSelection(selectedTasks) });
        navigate("/tasks/finalize");
    };

    const createAssignment = () => {
        if (wizard.studentId === null) {
            setErrorMessage("Выберите ученика");
            return;
        }
        if (wizard.draftTasks.length === 0) {
            setErrorMessage("Выберите хотя бы одно задание");
            return;
        }
        if (!isDraftBlocksStructureValid(wizard.draftTasks)) {
            setErrorMessage("Исправьте структуру блоков перед отправкой");
            return;
        }

        setErrorMessage(null);
        createMutation.mutate({
            title: wizard.title.trim() || DEFAULT_HOMEWORK_TITLE,
            student_ids: [wizard.studentId],
            tasks: wizard.draftTasks.map((item, index) => ({
                task_bank_item_id: item.task_bank_item_id,
                lesson_id: item.lesson_id,
                sort: index,
                title: item.title.trim() || "Задание",
                task: item.task,
            })),
        });
    };

    return (
        <div className="container pb-5" style={{ maxWidth: "1120px" }}>
            <PageTitle title="タスク" />
            <div className="d-flex flex-wrap gap-2 mb-3">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`btn ${activeTab === tab.key ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => navigate(tab.path)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {errorMessage ? <div className="alert alert-warning">{errorMessage}</div> : null}

            {activeTab === "assign" && !isFinalizeRoute ? (
                <TasksAssignStep
                    options={options}
                    bankItems={bank.items}
                    wizard={wizard}
                    dispatch={dispatchWizard}
                    availableTasks={availableTasks}
                    selectedTaskIds={selectedTaskIds}
                    onConfirm={confirmSelection}
                />
            ) : null}

            {activeTab === "assign" && isFinalizeRoute ? (
                <TasksFinalizeStep
                    students={options.students}
                    wizard={wizard}
                    dispatch={dispatchWizard}
                    isCreating={createMutation.isPending}
                    onCreate={createAssignment}
                />
            ) : null}

            {activeTab === "bank" ? (
                <TaskBankSection
                    lessons={options.lessons}
                    bank={bank}
                    currentLessonId={bankLessonId}
                    onError={setErrorMessage}
                />
            ) : null}

            {activeTab === "history" ? (
                <TasksHistoryList
                    assignments={assignmentsQuery.data.assignments}
                    lessons={options.lessons}
                    onError={setErrorMessage}
                />
            ) : null}
        </div>
    );
};

export default TeacherTasksManager;
