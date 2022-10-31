import React from "react";
import { LogInfo } from "libs/Logger";
import { selectDrilling, setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import { Button } from "react-bootstrap";
import StudentDrillingTaskInterface, { StudentDrillingTaskProps } from "./StudentDrillingTaskInterface";
import { useAppDispatch, useAppSelector } from "redux/hooks";

const StudentDrillingTranslate = ({ inData, goToNextTaskCallback }: StudentDrillingTaskProps) => {
    const dispatch = useAppDispatch();
    const item = useAppSelector(selectDrilling).selectedItem;

    const getObjectData = (id: number) => {
        return {
            wordId: id,
            inputText: "",
            wordJP: inData.WordsJP[id % inData.WordsJP.length],
        };
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setDrillingSelectedItemField({ inputText: e.target.value }));
    };

    const nextWord = () => {
        LogInfo(inData.WordsRU, item.inputText.trim());
        if (inData.WordsRU[item.wordId] === item.inputText.trim())
            dispatch(setDrillingSelectedItemField({ ...getObjectData(item.wordId + 1) }));
    };

    return (
        <StudentDrillingTaskInterface
            taskTypeName="drillingtranslate"
            newObjectData={{ ...getObjectData(0) }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return item.wordId === inData.WordsJP.length;
            }}
            maincontent={() => {
                return (
                    <div>
                        <div>
                            <div>{item.wordJP}</div>
                            <div>
                                <input type="text" value={item.inputText} onChange={handleTextChange} />
                                <Button onClick={nextWord}> Next </Button>
                            </div>
                        </div>
                    </div>
                );
            }}
        />
    );
};

export default StudentDrillingTranslate;
