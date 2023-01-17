import React from "react";
import { LogInfo } from "libs/Logger";
import { selectDrilling, setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import { Button } from "react-bootstrap";
import StudentDrillingTaskInterface, { StudentDrillingTaskProps } from "./StudentDrillingTaskInterface";
import { useAppDispatch, useAppSelector } from "redux/hooks";

const StudentDrillingTranslate = ({ name, inData, goToNextTaskCallback }: StudentDrillingTaskProps) => {
    const dispatch = useAppDispatch();
    const item = useAppSelector(selectDrilling).selectedItem;

    const getObjectData = (id: number) => {
        return {
            wordId: id,
            inputText: "",
            wordJP: inData.words_jp[id % inData.words_jp.length],
        };
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setDrillingSelectedItemField({ inputText: e.target.value }));
    };

    const nextWord = () => {
        LogInfo(inData.words_ru, item.inputText.trim());
        if (inData.words_ru[item.wordId] === item.inputText.trim())
            dispatch(setDrillingSelectedItemField({ ...getObjectData(item.wordId + 1) }));
    };

    return (
        <StudentDrillingTaskInterface
            name={name}
            taskTypeName="translate"
            newObjectData={{ ...getObjectData(0) }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return item.wordId === inData.words_jp.length;
            }}
            maincontent={() => {
                return (
                    <div>
                        <div>{item.wordJP}</div>
                        <div>
                            <input type="text" value={item.inputText} onChange={handleTextChange} />
                            <Button onClick={nextWord}> Next </Button>
                        </div>
                    </div>
                );
            }}
        />
    );
};

export default StudentDrillingTranslate;
