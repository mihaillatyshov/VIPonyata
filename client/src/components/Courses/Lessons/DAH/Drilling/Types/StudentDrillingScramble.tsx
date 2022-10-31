import React from "react";
import { LogInfo } from "libs/Logger";
import { selectDrilling, setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import { Button } from "react-bootstrap";
import StudentDrillingTaskInterface, { StudentDrillingTaskProps } from "./StudentDrillingTaskInterface";
import { useAppDispatch, useAppSelector } from "redux/hooks";

const StudentDrillingScramble = ({ inData, goToNextTaskCallback }: StudentDrillingTaskProps) => {
    const dispatch = useAppDispatch();
    const item = useAppSelector(selectDrilling).selectedItem;

    const setNewWord = (id: number) => {
        return {
            wordId: id,
            usedChars: inData.chars[id % inData.words.length],
            doneWord: Array.from({ length: inData.chars[id % inData.words.length].length }, () => "⠀"),
            message: "Собери слово!",
        };
    };

    const doneWordClick = (id: number) => {
        if (item.doneWord[id] !== "⠀") {
            let newDoneWord = [...item.doneWord];
            let newUsedChars = [...item.usedChars, newDoneWord[id]];
            newDoneWord[id] = "⠀";
            dispatch(setDrillingSelectedItemField({ doneWord: newDoneWord, usedChars: newUsedChars }));
        }
    };

    const usedCharsClick = (id: number) => {
        let newUsedChars = [...item.usedChars];
        let newDoneWord = [...item.doneWord];
        for (let i = 0; i < newDoneWord.length; i++) {
            if (newDoneWord[i] === "⠀") {
                newDoneWord[i] = newUsedChars[id];
                break;
            }
        }
        newUsedChars.splice(id, 1);
        dispatch(setDrillingSelectedItemField({ doneWord: newDoneWord, usedChars: newUsedChars }));

        for (let i = 0; i < newDoneWord.length; i++) {
            LogInfo("NDW", newDoneWord, inData.words[item.wordId][i]);
            if (newDoneWord[i] !== inData.words[item.wordId][i]) {
                return;
            }
        }
        // if last word, save changes and go to hub
        dispatch(setDrillingSelectedItemField({ ...setNewWord(item.wordId + 1) }));
    };

    return (
        <StudentDrillingTaskInterface
            taskTypeName="drillingscramble"
            newObjectData={{
                ...setNewWord(0),
            }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return item.wordId === inData.words.length;
            }}
            maincontent={() => {
                return (
                    <div>
                        <div>
                            <div> {item.nowId} </div>
                            <div>
                                {item.doneWord.map((word: string, key: number) => (
                                    <Button
                                        className="scrambleItem"
                                        key={key}
                                        variant="outline-dark"
                                        onClick={() => doneWordClick(key)}
                                    >
                                        {" "}
                                        {word}{" "}
                                    </Button>
                                ))}
                            </div>
                            <div>
                                {item.usedChars.map((char: string, key: number) => (
                                    <Button
                                        className="scrambleItem"
                                        key={key}
                                        variant="outline-dark"
                                        onClick={() => usedCharsClick(key)}
                                    >
                                        {" "}
                                        {char}{" "}
                                    </Button>
                                ))}
                            </div>
                            <div> {inData.words[item.wordId]} </div>
                            <div> {item.message} </div>
                        </div>
                    </div>
                );
            }}
        />
    );
};

export default StudentDrillingScramble;
