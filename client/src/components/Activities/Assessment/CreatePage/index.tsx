import React, { useRef, useState } from "react";

import PageTitle from "components/Common/PageTitle";
import InputError from "components/Form/InputError";
import InputTextArea from "components/Form/InputTextArea";
import InputTime from "components/Form/InputTime";
import { PyErrorDict } from "libs/PyError";
import { AjaxPost } from "libs/ServerAPI";
import { uuid } from "libs/uuid";
import {
    getTeacherAssessmentTaskDefaultData,
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetTeacherTypeByName,
    TTeacherAssessmentAnyItem,
    TTeacherAssessmentItems,
} from "models/Activity/Items/TAssessmentItems";
import { useNavigate, useParams } from "react-router-dom";

import AddTaskButton from "./AddTaskButton";
import SelectTypeModal from "./SelectTypeModal";
import TeacherAssessmentAudio from "./Types/TeacherAssessmentAudio";
import TeacherAssessmentClassification from "./Types/TeacherAssessmentClassification";
import TeacherAssessmentCreateSentence from "./Types/TeacherAssessmentCreateSentence";
import TeacherAssessmentFillSpacesByHand from "./Types/TeacherAssessmentFillSpacesByHand";
import TeacherAssessmentFillSpacesExists from "./Types/TeacherAssessmentFillSpacesExists";
import TeacherAssessmentFindPair from "./Types/TeacherAssessmentFindPair";
import TeacherAssessmentImg from "./Types/TeacherAssessmentImg";
import TeacherAssessmentOpenQuestion from "./Types/TeacherAssessmentOpenQuestion";
import TeacherAssessmentSentenceOrder from "./Types/TeacherAssessmentSentenceOrder";
import TeacherAssessmentTestMulti from "./Types/TeacherAssessmentTestMulti";
import TeacherAssessmentTestSingle from "./Types/TeacherAssessmentTestSingle";
import TeacherAssessmentText from "./Types/TeacherAssessmentText";
import TeacherAssessmentTypeBase, { TeacherAssessmentTypeProps } from "./Types/TeacherAssessmentTypeBase";

interface IAssessmentCreatePageProps {
    title: string;
}

interface TAssessmentCreateResponse {
    assessment: {
        lesson_id: number;
    };
}

type TAliasProp<T extends TAssessmentItemBase> = (props: TeacherAssessmentTypeProps<T>) => JSX.Element;

type TAliases = {
    [key in TAssessmentTaskName]: TAliasProp<TGetTeacherTypeByName[key]>;
};

const aliases: TAliases = {
    text: TeacherAssessmentText,
    test_single: TeacherAssessmentTestSingle,
    test_multi: TeacherAssessmentTestMulti,
    find_pair: TeacherAssessmentFindPair,
    create_sentence: TeacherAssessmentCreateSentence,
    fill_spaces_exists: TeacherAssessmentFillSpacesExists,
    fill_spaces_by_hand: TeacherAssessmentFillSpacesByHand,
    classification: TeacherAssessmentClassification,
    sentence_order: TeacherAssessmentSentenceOrder,
    open_question: TeacherAssessmentOpenQuestion,
    img: TeacherAssessmentImg,
    audio: TeacherAssessmentAudio,
};

const IAssessmentCreatePage = ({ title }: IAssessmentCreatePageProps) => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [isShowSelectTypeModal, setIsShowSelectTypeModal] = useState<boolean>(false);
    const [taskIdToAdd, setTaskIdToAdd] = useState<number | undefined>(undefined);

    const tasksHashes = useRef<string[]>([]);
    const [tasks, setTasks] = useState<TTeacherAssessmentItems>([]);
    const [timelimit, setTimelimit] = useState<string>("00:00:00");
    const [description, setDescription] = useState<string>("");
    const [errors, setErrors] = useState<PyErrorDict>({ errors: {}, message: "" });

    const openModal = (id: number) => {
        setTaskIdToAdd(id);
        setIsShowSelectTypeModal(true);
    };

    const addTask = (name: TAssessmentTaskName) => {
        if (taskIdToAdd === undefined) return;

        while (true) {
            const id = uuid();
            if (tasksHashes.current.includes(id)) continue;

            tasksHashes.current.splice(taskIdToAdd, 0, id);
            break;
        }
        setTasks((prev) => {
            prev.splice(taskIdToAdd, 0, getTeacherAssessmentTaskDefaultData(name));
            return [...prev];
        });
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

    const submitHandler = () => {
        AjaxPost<TAssessmentCreateResponse>({
            url: `/api/assessment/${lessonId}`,
            body: {
                tasks: tasks,
                time_limit: timelimit === "00:00:00" || timelimit === "" ? null : timelimit,
                description,
            },
        })
            .then((json) => {
                navigate(`/lessons/${json.assessment.lesson_id}`);
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    console.log(json, response);
                    if (response.status === 422) setErrors(json);
                    if (response.status === 404 || response.status === 403) navigate("/");
                }
            });
    };

    const drawItem = <T extends TTeacherAssessmentAnyItem>(item: T, id: number, taskUUID: string) => {
        const component = aliases[item.name] as any as TAliasProp<T>;
        return React.createElement(component, {
            data: item,
            taskUUID: taskUUID,
            onChangeTask: (data: T) => changeTaskHandler<T>(id, data),
        });
    };

    return (
        <div className="container mb-5 pb-5">
            <PageTitle title={title} />
            <input type="button" className="btn btn-success w-100 mb-5" onClick={submitHandler} value={"Создать"} />

            <InputTime
                placeholder="Лимит времени"
                value={timelimit}
                onChangeHandler={setTimelimit}
                htmlId="timelimit"
            />
            <InputTextArea
                htmlId="description"
                placeholder="Описание"
                rows={5}
                onChangeHandler={setDescription}
                value={description}
            />

            {tasks.map((item, i) => (
                <React.Fragment key={tasksHashes.current[i]}>
                    {tasksHashes.current[i]}
                    <AddTaskButton insertId={i} handleClick={openModal} />
                    <TeacherAssessmentTypeBase
                        taskName={item.name}
                        removeTask={() => removeTask(i)}
                        error={errors.errors[`${i}`] || ""}
                    >
                        <div>{drawItem(item, i, tasksHashes.current[i])}</div>
                    </TeacherAssessmentTypeBase>
                </React.Fragment>
            ))}
            <AddTaskButton insertId={tasks.length} handleClick={openModal} />

            <InputError message={errors.message} />
            <SelectTypeModal
                isShow={isShowSelectTypeModal}
                close={() => setIsShowSelectTypeModal(false)}
                addTask={addTask}
            />
        </div>
    );
};

export const AssessmentCreatePage = () => <IAssessmentCreatePage title="Урок" />;
