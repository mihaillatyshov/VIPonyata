import React from "react";

import { TScramble } from "models/Activity/Items/TLexisItems";
import { TStudentLexisTryScrambleTask } from "models/Activity/Try/TLexisTry";

import { pickScrambeWordOrChar, StudentLexisTaskProps, useLexisItem, useSetLexisSelectedItemField } from "./LexisUtils";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";
import { StudentLexisTaskTitle } from "./StudentLexisTaskTitle";

const StudentLexisScramble = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TScramble>) => {
    const item = useLexisItem<TStudentLexisTryScrambleTask>(name);
    const setLexisSelectedItemField = useSetLexisSelectedItemField<TStudentLexisTryScrambleTask>(name);
    const [full, symb] = pickScrambeWordOrChar(name);

    const setNewWord = (id: number) => {
        return {
            wordId: id,
            usedChars: inData[symb][id % inData[full].length],
            doneWord: Array.from({ length: inData[symb][id % inData[full].length].length }, () => "⠀"),
            message: "Собери слово!",
        };
    };

    const doneWordClick = (id: number) => {
        if (item.doneWord[id] !== "⠀") {
            let newDoneWord = [...item.doneWord];
            let newUsedChars = [...item.usedChars, newDoneWord[id]];
            newDoneWord[id] = "⠀";
            setLexisSelectedItemField({ doneWord: newDoneWord, usedChars: newUsedChars });
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
        setLexisSelectedItemField({ doneWord: newDoneWord, usedChars: newUsedChars });

        for (let i = 0; i < newDoneWord.length; i++) {
            if (newDoneWord[i] !== inData[full][item.wordId][i]) {
                return;
            }
        }
        // if last word, save changes and go to hub
        setLexisSelectedItemField({ ...setNewWord(item.wordId + 1) });
    };

    return (
        <StudentLexisTaskInterface
            name={name}
            taskTypeName="scramble"
            newObjectData={{
                ...setNewWord(0),
            }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return item.wordId === inData[full].length;
            }}
            maincontent={() => {
                return (
                    <div className="d-flex flex-column align-items-center">
                        <StudentLexisTaskTitle title="Собери слово" />
                        <div className="d-flex">
                            {item.doneWord.map((word: string, key: number) => (
                                <div
                                    className="student-lexis-scramble__item-selected"
                                    key={key}
                                    onClick={() => doneWordClick(key)}
                                >
                                    {word}
                                </div>
                            ))}
                        </div>
                        <div className="d-flex mt-3 gap-2">
                            {item.usedChars.map((char: string, key: number) => (
                                <div
                                    className="student-lexis-scramble__item"
                                    key={key}
                                    onClick={() => usedCharsClick(key)}
                                >
                                    {char}
                                </div>
                            ))}
                        </div>
                        {/* <div> {inData[full][item.wordId]} </div> */}
                    </div>
                );
            }}
        />
    );
};

export default StudentLexisScramble;
