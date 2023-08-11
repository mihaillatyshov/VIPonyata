import React, { useState } from "react";
import { LexisName } from "components/Activities/Lexis/Types/LexisUtils";
import Tasks, { SelectableTask } from "./Tasks";
import { LexisTaskName, LexisTaskNameSelectable } from "models/Activity/ILexis";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import NewWordsModal, { DictionaryWord } from "./NewWordsModal";
import WordsTable from "./WordsTable";

interface LexisCreatePageProps {
    title: string;
    name: LexisName;
}

const getDefaultTasksArray = (): SelectableTask[] => {
    return Object.values(LexisTaskName)
        .filter((taskName) => taskName !== "card")
        .map((taskName) => ({ name: taskName, isSelected: false }));
};

const LexisCreatePage = ({ title, name }: LexisCreatePageProps) => {
    const [tasks, setTasks] = useState<SelectableTask[]>(getDefaultTasksArray());
    const [isShowNewWordsModal, setIsShowNewWordsModal] = useState<boolean>(false);
    const [newWords, setNewWords] = useState<DictionaryWord[]>([]);

    const findIndex = (inTaskName: string): number => {
        return Object.values(tasks).findIndex(({ name }) => name === inTaskName);
    };

    const onSelectedChange = (taskName: LexisTaskName, checked: boolean) => {
        const newTasks = [...tasks];
        newTasks[findIndex(taskName)] = { name: taskName, isSelected: checked };
        setTasks(newTasks);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over === null) return;

        if (active?.data?.current?.taskName !== over?.data?.current?.taskName) {
            const activeId = findIndex(active?.data?.current?.taskName);
            const overId = findIndex(over?.data?.current?.taskName);

            setTasks(arrayMove(tasks, activeId, overId));
        }
    };

    return (
        <div className="container">
            <div>{title}</div>
            <input
                type="button"
                className="btn btn-primary"
                onClick={() => setIsShowNewWordsModal(true)}
                value={"Импортировать слова"}
            />
            <Tasks tasks={tasks} handleDragEnd={handleDragEnd} setSelected={onSelectedChange} />
            <NewWordsModal
                isShow={isShowNewWordsModal}
                close={() => setIsShowNewWordsModal(false)}
                setWords={setNewWords}
                colToCheck={name === "drilling" ? "word_jp" : "char_jp"}
            />
            <WordsTable words={newWords} />
        </div>
    );
};

export default LexisCreatePage;
