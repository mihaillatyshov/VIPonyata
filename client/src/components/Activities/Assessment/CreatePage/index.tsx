import PageTitle from "components/Common/PageTitle";
import InputTextArea from "components/Form/InputTextArea";
import InputTime from "components/Form/InputTime";
import React, { useState } from "react";
import SelectTypeModal from "./SelectTypeModal";
import {
    TGetTeacherTypeByName,
    TAssessmentTaskName,
    getTeacherAssessmentTaskDefaultData,
    TTeacherAssessmentItems,
    TTeacherAssessmentAnyItem,
} from "models/Activity/Items/TAssessmentItems";
import TeacherAssessmentTypeBase, { TeacherAssessmentTypeProps } from "./Types/TeacherAssessmentTypeBase";
import TeacherAssessmentText from "./Types/TeacherAssessmentText";
import TeacherAssessmentTestSingle from "./Types/TeacherAssessmentTestSingle";
import TeacherAssessmentTestMulti from "./Types/TeacherAssessmentTestMulti";
import TeacherAssessmentFindPair from "./Types/TeacherAssessmentFindPair";
import TeacherAssessmentCreateSentence from "./Types/TeacherAssessmentCreateSentence";
import TeacherAssessmentFillSpacesExists from "./Types/TeacherAssessmentFillSpacesExists";
import TeacherAssessmentFillSpacesByHand from "./Types/TeacherAssessmentFillSpacesByHand";
import TeacherAssessmentClassification from "./Types/TeacherAssessmentClassification";
import TeacherAssessmentSentenceOrder from "./Types/TeacherAssessmentSentenceOrder";
import TeacherAssessmentOpenQuestion from "./Types/TeacherAssessmentOpenQuestion";
import TeacherAssessmentImg from "./Types/TeacherAssessmentImg";
import AddTaskButton from "./AddTaskButton";
import { AjaxPost } from "libs/ServerAPI";
import { useNavigate, useParams } from "react-router-dom";
import { PyErrorResponse } from "libs/PyError";

interface IAssessmentCreatePageProps {
    title: string;
}

interface TAssessmentCreateResponse {
    assessment: {
        lesson_id: number;
    };
}

type TAliasProp<T> = (props: TeacherAssessmentTypeProps<T>) => JSX.Element;

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
};

const IAssessmentCreatePage = ({ title }: IAssessmentCreatePageProps) => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [isShowSelectTypeModal, setIsShowSelectTypeModal] = useState<boolean>(false);
    const [taskIdToAdd, setTaskIdToAdd] = useState<number | undefined>(undefined);

    const [tasks, setTasks] = useState<TTeacherAssessmentItems>([]);
    const [timelimit, setTimelimit] = useState<string>("00:00:00");
    const [description, setDescription] = useState<string>("");
    const [errors, setErrors] = useState<PyErrorResponse>({});

    const openModal = (id: number) => {
        setTaskIdToAdd(id);
        setIsShowSelectTypeModal(true);
    };

    const addTask = (name: TAssessmentTaskName) => {
        if (taskIdToAdd === undefined) return;

        setTasks((prev) => {
            prev.splice(taskIdToAdd, 0, getTeacherAssessmentTaskDefaultData(name));
            return [...prev];
        });
    };

    const removeTask = (taskId: number) => {
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
                    if (response.status === 422) setErrors(json.errors);
                    if (response.status === 404 || response.status === 403) navigate("/");
                }
            });
    };

    const drawItem = <T extends TTeacherAssessmentAnyItem>(item: T, id: number) => {
        const task = tasks[id];
        const component = aliases[task.name] as any as TAliasProp<T>;
        return React.createElement(component, { data: item, taskId: id, onChangeTask: changeTaskHandler<T> });
    };

    return (
        <div className="container mb-5 pb-5">
            <PageTitle title={title} />
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
                <React.Fragment key={`${item.name}_${i}`}>
                    <AddTaskButton insertId={i} handleClick={openModal} />
                    <TeacherAssessmentTypeBase
                        taskId={i}
                        taskName={item.name}
                        removeTask={removeTask}
                        errors={errors[`${i}`]}
                    >
                        <div>{drawItem(item, i)}</div>
                    </TeacherAssessmentTypeBase>
                </React.Fragment>
            ))}
            <AddTaskButton insertId={tasks.length} handleClick={openModal} />

            <input type="button" className="btn btn-success w-100 mt-5" onClick={submitHandler} value={"Создать"} />
            <SelectTypeModal
                isShow={isShowSelectTypeModal}
                close={() => setIsShowSelectTypeModal(false)}
                addTask={addTask}
            />
        </div>
    );
};

export const AssessmentCreatePage = () => <IAssessmentCreatePage title="Урок" />;
