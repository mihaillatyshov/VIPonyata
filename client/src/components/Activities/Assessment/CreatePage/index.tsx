import PageTitle from "components/Common/PageTitle";
import InputError from "components/Form/InputError";
import InputTextArea from "components/Form/InputTextArea";
import InputTime from "components/Form/InputTime";
import React, { useEffect, useState } from "react";
import SelectTypeModal from "./SelectTypeModal";
import {
    GetTypeByName,
    TAssessmentAnyItem,
    TAssessmentItems,
    TAssessmentTaskName,
    getAssessmentTaskDefaultData,
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

interface IAssessmentCreatePageProps {
    title: string;
}

type TAliasProp<T> = (props: TeacherAssessmentTypeProps<T>) => JSX.Element;

type TAliases = {
    [key in TAssessmentTaskName]: TAliasProp<GetTypeByName[key]>;
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
    const [isShowSelectTypeModal, setIsShowSelectTypeModal] = useState<boolean>(false);
    const [taskIdToAdd, setTaskIdToAdd] = useState<number | undefined>(undefined);

    const [tasks, setTasks] = useState<TAssessmentItems>([]);
    const [timelimit, setTimelimit] = useState<string>("00:00:00");
    const [description, setDescription] = useState<string>("");
    const [error, setError] = useState<string>("");

    const openModal = (id: number) => {
        setTaskIdToAdd(id);
        setIsShowSelectTypeModal(true);
    };

    // ! DEBUG
    useEffect(() => {
        setTasks(Object.values(TAssessmentTaskName).map((taskName) => getAssessmentTaskDefaultData(taskName)));
    }, []);

    const addTask = (name: TAssessmentTaskName) => {
        if (taskIdToAdd === undefined) return;

        setTasks((prev) => {
            prev.splice(taskIdToAdd, 0, getAssessmentTaskDefaultData(name));
            return [...prev];
        });
    };

    const removeTask = (taskId: number) => {
        const newTasks = [...tasks];
        newTasks.splice(taskId, 1);
        setTasks(newTasks);
    };

    const changeTaskHandler = <T extends TAssessmentAnyItem>(taskId: number, data: T) => {
        setTasks((prev) => {
            prev[taskId] = data;
            return [...prev];
        });
    };

    const submitHandler = () => {};

    const drawItem = <T extends TAssessmentAnyItem>(item: T, id: number) => {
        const task = tasks[id];
        const component = aliases[task.name] as any as TAliasProp<T>;
        return React.createElement(component, { data: item, taskId: id, onChangeTask: changeTaskHandler<T> });
    };

    return (
        <div className="container">
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
                    <TeacherAssessmentTypeBase taskId={i} taskName={item.name} removeTask={removeTask}>
                        <div>{drawItem(item, i)}</div>
                    </TeacherAssessmentTypeBase>
                </React.Fragment>
            ))}
            <AddTaskButton insertId={tasks.length} handleClick={openModal} />

            <InputError message={error} className="mt-2" />
            <input type="button" className="btn btn-success w-100 mt-2" onClick={submitHandler} value={"Создать"} />
            <SelectTypeModal
                isShow={isShowSelectTypeModal}
                close={() => setIsShowSelectTypeModal(false)}
                addTask={addTask}
            />
        </div>
    );
};

export const AssessmentCreatePage = () => <IAssessmentCreatePage title="Урок" />;
