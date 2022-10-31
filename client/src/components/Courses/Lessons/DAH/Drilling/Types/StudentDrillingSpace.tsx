import React from "react";
import { LogInfo } from "libs/Logger";
import { selectDrilling, setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import { Button } from "react-bootstrap";
import StudentDrillingTaskInterface, { StudentDrillingTaskProps } from "./StudentDrillingTaskInterface";
import { useAppDispatch, useAppSelector } from "redux/hooks";

const StudentDrillingSpace = ({ inData, goToNextTaskCallback }: StudentDrillingTaskProps) => {
    const dispatch = useAppDispatch();
    const item = useAppSelector(selectDrilling).selectedItem;

    LogInfo("Space", inData);

    const getWordData = (id: number) => {
        LogInfo(id, inData.Words[id % inData.Words.length].WordStart, inData.Words[id % inData.Words.length].WordEnd);
        return {
            inputText: "",
            wordId: id,
            wordStart: inData.Words[id % inData.Words.length].WordStart,
            wordEnd: inData.Words[id % inData.Words.length].WordEnd,
        };
    };

    const nextWord = () => {
        const fullInput = item.wordStart + item.inputText.trim() + item.wordEnd;
        LogInfo(inData.Words[item.wordId], fullInput);
        if (inData.Words[item.wordId].WordJP === fullInput) {
            dispatch(setDrillingSelectedItemField({ ...getWordData(item.wordId + 1) }));
        }
    };

    return (
        <StudentDrillingTaskInterface
            taskTypeName="drillingspace"
            newObjectData={{
                ...getWordData(0),
            }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return inData.Words.length === item.wordId;
            }}
            maincontent={() => {
                return (
                    <div>
                        <div>
                            <div>
                                <div>
                                    <div className="input-group my-3">
                                        <div className="input-group-prepend">
                                            <span className="input-group-text" id="inputGroup-sizing-default">
                                                {item.wordStart === "" ? "⠀" : item.wordStart}
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control"
                                            aria-label="Default"
                                            aria-describedby="inputGroup-sizing-default"
                                            value={item.inputText}
                                            onChange={(e) =>
                                                dispatch(setDrillingSelectedItemField({ inputText: e.target.value }))
                                            }
                                        />
                                        <div className="input-group-append">
                                            <span className="input-group-text" id="inputGroup-sizing-default">
                                                {item.wordEnd === "" ? "⠀" : item.wordEnd}
                                            </span>
                                        </div>
                                    </div>

                                    <Button onClick={nextWord}> Next </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }}
        />
    );
};

export default StudentDrillingSpace;
