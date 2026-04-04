import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AddBlockButton } from "components/Activities/Assessment/ProcessingPage/AddBlockButton";
import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import InputError from "components/Form/InputError";
import InputTime from "components/Form/InputTime";
import { PyErrorDict } from "libs/PyError";
import { AjaxDelete, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { swapElements } from "libs/swapArrayElements";
import { uuid } from "libs/uuid";
import { IAssessmentName } from "models/Activity/IActivity";
import {
    getTeacherAssessmentTaskDefaultData,
    TAssessmentTaskName,
    TTeacherAssessmentAnyItem,
    TTeacherAssessmentItems,
} from "models/Activity/Items/TAssessmentItems";
import { TProcessingType } from "models/Processing";
import { ProcessingButtonBlock } from "ui/Processing/ProcessingButtonBlock";

import AddTaskButton from "./AddTaskButton";
import { getProcessingData, processingAliases, TAliasProp } from "./AssessmentProcessingUtils";
import SelectTypeModal from "./SelectTypeModal";
import TeacherAssessmentTypeBase from "./Types/TeacherAssessmentTypeBase";

export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let l = array.length;
    while (l--) {
        if (predicate(array[l], l, array)) return l;
    }
    return -1;
}

const isTaskErrorKey = (key: string, taskId: number): boolean => {
    const prefix = `${taskId}`;
    return key === prefix || key.startsWith(`${prefix}.`) || key.startsWith(`${prefix}[`);
};

interface IAssessmentProcessingResponse {
    assessment: {
        lesson_id: number;
    };
}

interface IAssessmentProcessingPageProps {
    title: string;
    name: IAssessmentName;
    processingType: TProcessingType;
}

export const IAssessmentProcessingPage = ({ title, name, processingType }: IAssessmentProcessingPageProps) => {
    const { id: idStr } = useParams();
    const id = parseInt(idStr || "");

    const navigate = useNavigate();

    const [isShowSelectTypeModal, setIsShowSelectTypeModal] = useState<boolean>(false);
    const [taskIdToAdd, setTaskIdToAdd] = useState<number | undefined>(undefined);

    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [error, setError] = useState<string>("");

    const tasksHashes = useRef<string[]>([]);
    const isInitialScrollFixed = useRef<boolean>(false);
    const [tasks, setTasks] = useState<TTeacherAssessmentItems>([]);
    const [timelimit, setTimelimit] = useState<string>("00:00:00");
    const [description, setDescription] = useState<string>("");
    const [errors, setErrors] = useState<PyErrorDict>({ errors: {}, message: "" });

    const [lessonId, setLessonId] = useState<number>(0);

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        setLoadStatus(LoadStatus.LOADING);

        getProcessingData(processingType, name, id).then((data) => {
            if (data.loadStatus === LoadStatus.ERROR) {
                setError(data.message);
                setLoadStatus(LoadStatus.ERROR);
                if (data.needExitPage) {
                    navigate("/");
                }
                return;
            }

            setLoadStatus(LoadStatus.DONE);
            setTasks(data.tasks);
            setTimelimit(data.timelimit);
            setDescription(data.description);
            setLessonId(data.lessonId);

            while (tasksHashes.current.length < data.tasks.length) {
                while (true) {
                    const id = uuid();
                    if (tasksHashes.current.includes(id)) continue;

                    tasksHashes.current.push(id);
                    break;
                }
            }
        });
    }, [id, name, processingType, navigate]);

    useEffect(() => {
        if (loadStatus !== LoadStatus.DONE || isInitialScrollFixed.current) {
            return;
        }

        isInitialScrollFixed.current = true;
        const timer = window.setTimeout(() => {
            const active = document.activeElement as HTMLElement | null;
            active?.blur();
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadStatus]);

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain={error}
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return (
            <div className="container d-flex flex-column justify-content-center align-items-center">
                <PageTitle title={title} />
                <Loading size="xxl" />
            </div>
        );
    }

    const checkBlocks = () => {
        const blocks = tasks.filter(
            (item, i) => item.name === TAssessmentTaskName.BLOCK_BEGIN || item.name === TAssessmentTaskName.BLOCK_END,
        );

        if (blocks.length % 2 !== 0) return false;

        for (let i = 1; i < blocks.length; i++) {
            if (blocks[i].name === blocks[i - 1].name) {
                return false;
            }
        }

        return true;
    };

    const handleProcessing = () => {
        const ajaxMethod = processingType === "edit" ? AjaxPatch : AjaxPost;

        if (!checkBlocks()) {
            setErrors({ message: "Ошибка: коллизия блоков!!!", errors: {} });
            return;
        }

        ajaxMethod<IAssessmentProcessingResponse>({
            url: `/api/${name}/${id}`,
            body: {
                tasks: tasks,
                time_limit: timelimit === "00:00:00" || timelimit === "" ? null : timelimit,
                description,
            },
        })
            .then((json) => {
                navigate(`/lessons/${json.assessment.lesson_id}`);
            })
            .catch(({ isServerError, response, json }) => {
                if (!isServerError) {
                    if (response.status === 422) setErrors(json);
                    else if (response.status === 404 || response.status === 403) navigate("/");
                    else setErrors({ message: "Неизвестная ошибка", errors: {} });
                } else setErrors({ message: "Ошибка соединения", errors: {} });
            });
    };

    const handleDelete = () => {
        AjaxDelete({ url: `/api/${name}/${id}` }).then(() => {
            navigate(`/lessons/${lessonId}`);
        });
    };

    const openModal = (id: number) => {
        setTaskIdToAdd(id);
        setIsShowSelectTypeModal(true);
    };

    const addTasks = (name: TAssessmentTaskName, taskData?: TTeacherAssessmentAnyItem[]) => {
        if (taskIdToAdd === undefined) {
            return;
        }

        const newHashesCount = taskData === undefined ? 1 : taskData.length;
        for (let i = 0; i < newHashesCount; i++) {
            while (true) {
                const id = uuid();
                if (tasksHashes.current.includes(id)) continue;

                tasksHashes.current.splice(taskIdToAdd, 0, id);
                break;
            }
        }

        if (taskData !== undefined) {
            tasks.splice(taskIdToAdd, 0, ...taskData);
        } else {
            tasks.splice(taskIdToAdd, 0, getTeacherAssessmentTaskDefaultData(name));
        }
        setTasks([...tasks]);
    };

    const isInsertionInsideBlock = (insertionIndex: number) => {
        let depth = 0;
        for (let i = 0; i < insertionIndex; i++) {
            if (tasks[i].name === TAssessmentTaskName.BLOCK_BEGIN) {
                depth++;
                continue;
            }

            if (tasks[i].name === TAssessmentTaskName.BLOCK_END) {
                depth = Math.max(0, depth - 1);
            }
        }

        return depth > 0;
    };

    const addBlock = (taskId: number) => {
        if (isInsertionInsideBlock(taskId)) {
            return;
        }

        const newHashesCount = 2;
        for (let i = 0; i < newHashesCount; i++) {
            while (true) {
                const id = uuid();
                if (tasksHashes.current.includes(id)) continue;

                tasksHashes.current.splice(taskId, 0, id);
                break;
            }
        }

        tasks.splice(
            taskId,
            0,
            getTeacherAssessmentTaskDefaultData(TAssessmentTaskName.BLOCK_BEGIN),
            getTeacherAssessmentTaskDefaultData(TAssessmentTaskName.BLOCK_END),
        );
        setTasks([...tasks]);
    };

    const moveTask = (taskId: number, direction: "up" | "down") => {
        const offset = direction === "up" ? -1 : 1;
        if (taskId + offset < 0 || taskId + offset >= tasks.length) return;
        swapElements(tasksHashes.current, taskId, taskId + offset);
        const newTasks = [...tasks];
        swapElements(newTasks, taskId, taskId + offset);
        setTasks(newTasks);
    };

    const moveUp = (taskId: number) => {
        moveTask(taskId, "up");
    };

    const moveDown = (taskId: number) => {
        moveTask(taskId, "down");
    };

    const removeTask = (taskId: number) => {
        const taskName = tasks[taskId].name;
        const newTasks = [...tasks];

        if (taskName === TAssessmentTaskName.BLOCK_BEGIN) {
            const endIndex = tasks.findIndex((item, i) => i > taskId && item.name === TAssessmentTaskName.BLOCK_END);
            if (endIndex !== -1) {
                tasksHashes.current.splice(endIndex, 1);
                newTasks.splice(endIndex, 1);
            }
        }

        tasksHashes.current.splice(taskId, 1);
        newTasks.splice(taskId, 1);

        if (taskName === TAssessmentTaskName.BLOCK_END) {
            const beginIndex = findLastIndex(
                tasks,
                (item, i) => i <= taskId && item.name === TAssessmentTaskName.BLOCK_BEGIN,
            );
            if (beginIndex !== -1) {
                tasksHashes.current.splice(beginIndex, 1);
                newTasks.splice(beginIndex, 1);
            }
        }

        setTasks(newTasks);
    };

    const changeTaskHandler = <T extends TTeacherAssessmentAnyItem>(taskId: number, data: T) => {
        setTasks((prev) => {
            prev[taskId] = data;
            return [...prev];
        });

        setErrors((prev) => {
            const nextErrors = Object.fromEntries(
                Object.entries(prev.errors).filter(([key]) => !isTaskErrorKey(key, taskId)),
            );

            if (Object.keys(nextErrors).length === Object.keys(prev.errors).length) {
                return prev;
            }

            return {
                ...prev,
                errors: nextErrors,
                message: Object.keys(nextErrors).length > 0 ? prev.message : "",
            };
        });
    };

    const drawItem = <T extends TTeacherAssessmentAnyItem>(item: T, id: number, taskUUID: string) => {
        const component = processingAliases[item.name] as any as TAliasProp<T>;
        return React.createElement(component, {
            data: item,
            taskUUID: taskUUID,
            onChangeTask: (data: T) => changeTaskHandler<T>(id, data),
        });
    };

    const renderTaskByIndex = (index: number) => {
        const item = tasks[index];
        const taskHash = tasksHashes.current[index];
        const hasTaskValidationError = Object.keys(errors.errors).some((key) => isTaskErrorKey(key, index));

        return (
            <React.Fragment key={taskHash}>
                <div className="text-center">
                    <AddTaskButton onClick={() => openModal(index)} />
                    {!isInsertionInsideBlock(index) && <AddBlockButton onClick={() => addBlock(index)} />}
                </div>
                <div className="teacher-assessment-task__wrapper">
                    <TeacherAssessmentTypeBase
                        taskName={item.name}
                        moveUp={() => moveUp(index)}
                        moveDown={() => moveDown(index)}
                        removeTask={() => removeTask(index)}
                        hasValidationError={hasTaskValidationError}
                    >
                        <div id={taskHash}>{drawItem(item, index, taskHash)}</div>
                    </TeacherAssessmentTypeBase>
                </div>
            </React.Fragment>
        );
    };

    const renderedTasks: React.ReactNode[] = [];
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].name === TAssessmentTaskName.BLOCK_BEGIN) {
            const blockEndIndex = tasks.findIndex(
                (item, index) => index > i && item.name === TAssessmentTaskName.BLOCK_END,
            );

            if (blockEndIndex !== -1) {
                renderedTasks.push(
                    <div className="teacher-assessment-block-container" key={`${tasksHashes.current[i]}-container`}>
                        {Array.from({ length: blockEndIndex - i + 1 }, (_, offset) => renderTaskByIndex(i + offset))}
                    </div>,
                );
                i = blockEndIndex;
                continue;
            }
        }

        renderedTasks.push(renderTaskByIndex(i));
    }

    return (
        <div className="container mb-5" style={{ maxWidth: "1100px", paddingBottom: 320, position: "relative" }}>
            <PageTitle title={title} urlBack={`/lessons/${lessonId}`} />
            <div className="teacher-assessment-page mt-3">
                <div>
                    <ProcessingButtonBlock
                        onSubmit={handleProcessing}
                        onDelete={handleDelete}
                        processingType={processingType}
                    />
                    <InputError message={errors.message} />
                </div>

                <div className="mt-3">
                    <InputTime
                        placeholder="Лимит времени"
                        value={timelimit}
                        onChangeHandler={setTimelimit}
                        htmlId="timelimit"
                    />
                </div>
                <div className="mt-3">
                    <FloatingLabelTextareaAutosize
                        htmlId="description"
                        placeholder="Описание"
                        rows={6}
                        onChangeHandler={setDescription}
                        value={description}
                    />
                </div>
                <hr className="student-assessment-divider" />

                <div className="teacher-assessment-tasks">
                    {renderedTasks}
                    <div className="text-center" key={tasks.length}>
                        <AddTaskButton onClick={() => openModal(tasks.length)} />
                        {!isInsertionInsideBlock(tasks.length) && (
                            <AddBlockButton onClick={() => addBlock(tasks.length)} />
                        )}
                    </div>
                </div>
            </div>

            <SelectTypeModal
                isShow={isShowSelectTypeModal}
                close={() => setIsShowSelectTypeModal(false)}
                addTasks={addTasks}
            />
        </div>
    );
};
