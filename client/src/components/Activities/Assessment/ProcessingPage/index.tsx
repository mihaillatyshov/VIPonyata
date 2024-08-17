import React, { useLayoutEffect, useRef, useState } from "react";

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
import { useNavigate, useParams } from "react-router-dom";
import { ProcessingButtonBlock } from "ui/Processing/ProcessingButtonBlock";

import AddTaskButton from "./AddTaskButton";
import { getProcessingData, processingAliases, TAliasProp } from "./AssessmentProcessingUtils";
import SelectTypeModal from "./SelectTypeModal";
import TeacherAssessmentTypeBase from "./Types/TeacherAssessmentTypeBase";

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
    const id = parseInt(idStr as string);

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
                <PageTitle className="ap-japanesefont" title={title} />
                <Loading size="xxl" />
            </div>
        );
    }
    const handleProcessing = () => {
        const ajaxMethod = processingType === "edit" ? AjaxPatch : AjaxPost;

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
                    if (response.status === 404 || response.status === 403) navigate("/");
                }
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

        setTasks((prev) => {
            if (taskData !== undefined) {
                prev.splice(taskIdToAdd, 0, ...taskData);
            } else {
                prev.splice(taskIdToAdd, 0, getTeacherAssessmentTaskDefaultData(name));
            }
            return [...prev];
        });
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
        tasksHashes.current.splice(taskId, 1);

        const newTasks = [...tasks];
        newTasks.splice(taskId, 1);
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

    return (
        <div className="container mb-5 pb-5">
            <PageTitle className="ap-japanesefont" title={title} />
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
                            <AddTaskButton insertId={i} handleClick={openModal} />
                            <TeacherAssessmentTypeBase
                                taskName={item.name}
                                moveUp={() => moveUp(i)}
                                moveDown={() => moveDown(i)}
                                removeTask={() => removeTask(i)}
                                error={errors.errors[`${i}`] || ""}
                            >
                                <div>{drawItem(item, i, tasksHashes.current[i])}</div>
                            </TeacherAssessmentTypeBase>
                        </React.Fragment>
                    ))}
                    <AddTaskButton insertId={tasks.length} handleClick={openModal} />
                </div>

                <SelectTypeModal
                    isShow={isShowSelectTypeModal}
                    close={() => setIsShowSelectTypeModal(false)}
                    addTasks={addTasks}
                />
            </div>
        </div>
    );
};
