import React from "react";
import { LogInfo } from "libs/Logger";
import { selectDrilling, setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import { Button } from "react-bootstrap";
import StudentDrillingTaskInterface, { StudentDrillingTaskProps } from "./StudentDrillingTaskInterface";
import { useAppDispatch, useAppSelector } from "redux/hooks";

const StudentDrillingSpace = ({ name, inData, goToNextTaskCallback }: StudentDrillingTaskProps) => {
    const dispatch = useAppDispatch();
    const item = useAppSelector(selectDrilling).selectedItem;

    LogInfo("Space", inData);

    const getWordData = (id: number) => {
        LogInfo(id, inData.words[id % inData.words.length].word_start, inData.words[id % inData.words.length].word_end);
        return {
            inputText: "",
            wordId: id,
            wordStart: inData.words[id % inData.words.length].word_start,
            wordEnd: inData.words[id % inData.words.length].word_end,
        };
    };

    const nextWord = () => {
        const fullInput = item.wordStart + item.inputText.trim() + item.wordEnd;
        LogInfo(inData.words[item.wordId], fullInput);
        if (inData.words[item.wordId].word_or_char_jp === fullInput) {
            dispatch(setDrillingSelectedItemField({ ...getWordData(item.wordId + 1) }));
        }
    };

    return (
        <StudentDrillingTaskInterface
            name={name}
            taskTypeName="space"
            newObjectData={{
                ...getWordData(0),
            }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return inData.words.length === item.wordId;
            }}
            maincontent={() => {
                return (
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
                                onChange={(e) => dispatch(setDrillingSelectedItemField({ inputText: e.target.value }))}
                            />
                            <div className="input-group-append">
                                <span className="input-group-text" id="inputGroup-sizing-default">
                                    {item.wordEnd === "" ? "⠀" : item.wordEnd}
                                </span>
                            </div>
                        </div>

                        <Button onClick={nextWord}> Next </Button>
                    </div>
                );
            }}
        />
    );
};

export default StudentDrillingSpace;
