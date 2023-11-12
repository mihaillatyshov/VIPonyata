import React from "react";

import { TScramble } from "models/Activity/Items/TLexisItems";

import { StudentLexisTaskProps, useLexisItem, useScrambeWordOrChar, useSetLexisSelectedItemField } from "./LexisUtils";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";
import { StudentLexisTaskTitle } from "./StudentLexisTaskTitle";

const StudentLexisScramble = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TScramble>) => {
    const item = useLexisItem(name);
    const setLexisSelectedItemField = useSetLexisSelectedItemField(name);
    const [full, symb] = useScrambeWordOrChar(name);

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
            console.log("NDW", newDoneWord, inData[full][item.wordId][i]);
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
                                    className="student-lexis-scramble__item"
                                    key={key}
                                    onClick={() => doneWordClick(key)}
                                >
                                    {word}
                                </div>
                            ))}
                        </div>
                        <div className="d-flex mt-2">
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
