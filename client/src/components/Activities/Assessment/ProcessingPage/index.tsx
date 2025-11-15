import React, { useLayoutEffect, useRef, useState } from "react";
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
import BlockLines from "./BlockLines";
import SelectTypeModal from "./SelectTypeModal";
import TeacherAssessmentTypeBase from "./Types/TeacherAssessmentTypeBase";

export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let l = array.length;
    while (l--) {
        if (predicate(array[l], l, array)) return l;
    }
    return -1;
}

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
    const [tasks, setTasks] = useState<TTeacherAssessmentItems>([]);
    const [timelimit, setTimelimit] = useState<string>("00:00:00");
    const [description, setDescription] = useState<string>("");
    const [errors, setErrors] = useState<PyErrorDict>({ errors: {}, message: "" });

    const [lessonId, setLessonId] = useState<number>(0);

    useLayoutEffect(() => {
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

    const addBlock = (taskId: number) => {
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
    };

    const drawItem = <T extends TTeacherAssessmentAnyItem>(item: T, id: number, taskUUID: string) => {
        const component = processingAliases[item.name] as any as TAliasProp<T>;
        return React.createElement(component, {
            data: item,
            taskUUID: taskUUID,
            onChangeTask: (data: T) => changeTaskHandler<T>(id, data),
        });
    };

    const blocks = tasks
        .map((item, i) =>
            item.name === TAssessmentTaskName.BLOCK_BEGIN || item.name === TAssessmentTaskName.BLOCK_END
                ? tasksHashes.current[i]
                : undefined,
        )
        .filter((item) => item !== undefined) as string[];

    return (
        <div className="container mb-5" style={{ paddingBottom: 320, position: "relative" }}>
            <PageTitle title={title} urlBack={`/lessons/${lessonId}`} />
            {/* <input type="button" className="btn btn-success w-100 mb-5" onClick={submitHandler} value={"Создать"} /> */}
            <div className="processing-page">
                <div className="processing-page__header">
                    <div>
                        <ProcessingButtonBlock
                            onSubmit={handleProcessing}
                            onDelete={handleDelete}
                            processingType={processingType}
                        />
                        <InputError message={errors.message} />
                    </div>

                    <div>
                        <InputTime
                            placeholder="Лимит времени"
                            value={timelimit}
                            onChangeHandler={setTimelimit}
                            htmlId="timelimit"
                        />
                    </div>
                    <FloatingLabelTextareaAutosize
                        htmlId="description"
                        placeholder="Описание"
                        rows={6}
                        onChangeHandler={setDescription}
                        value={description}
                    />
                </div>

                <div className="processing-page__content">
                    {tasks.map((item, i) => (
                        <React.Fragment key={tasksHashes.current[i]}>
                            <div className="text-center" key={i}>
                                <AddTaskButton onClick={() => openModal(i)} />
                                <AddBlockButton onClick={() => addBlock(i)} />
                            </div>
                            <TeacherAssessmentTypeBase
                                taskName={item.name}
                                moveUp={() => moveUp(i)}
                                moveDown={() => moveDown(i)}
                                removeTask={() => removeTask(i)}
                                error={errors.errors[`${i}`] || ""}
                            >
                                <div id={tasksHashes.current[i]}>{drawItem(item, i, tasksHashes.current[i])}</div>
                            </TeacherAssessmentTypeBase>
                        </React.Fragment>
                    ))}
                    <div className="text-center" key={tasks.length}>
                        <AddTaskButton onClick={() => openModal(tasks.length)} />
                        <AddBlockButton onClick={() => addBlock(tasks.length)} />
                    </div>
                </div>

                <BlockLines lines={blocks} />

                <SelectTypeModal
                    isShow={isShowSelectTypeModal}
                    close={() => setIsShowSelectTypeModal(false)}
                    addTasks={addTasks}
                />
            </div>
        </div>
    );
};
