import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { LogInfo } from "libs/Logger";
import { setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import { Button } from "react-bootstrap";
import StudentDrillingTaskInterface from "./StudentDrillingTaskInterface";

const StudentDrillingTranslate = ({ inData, goToNextTaskCallback }) => {
    const dispatch = useDispatch();
    const item = useSelector((state) => state.drilling.selectedItem);

    const getObjectData = (id) => {
        return {
            wordId: id,
            inputText: "",
            wordJP: inData.WordsJP[id % inData.WordsJP.length],
        };
    };

    const handleTextChange = (e) => {
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
