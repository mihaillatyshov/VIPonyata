import React from "react";

import InputText from "components/Form/InputText";
import { TTranslate } from "models/Activity/Items/TLexisItems";
import { TStudentLexisTranslateTask } from "models/Activity/Try/TLexisTry";

import { pickLexisWordsOrChars, StudentLexisTaskProps, useLexisItem, useSetLexisSelectedItemField } from "./LexisUtils";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";
import { StudentLexisTaskTitle } from "./StudentLexisTaskTitle";

const StudentLexisTranslate = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TTranslate>) => {
    const item = useLexisItem<TStudentLexisTranslateTask>(name);
    const setLexisSelectedItemField = useSetLexisSelectedItemField<TStudentLexisTranslateTask>(name);
    const aliasJP = pickLexisWordsOrChars(name);

    console.log("StudentLexisTranslate", item);

    const getObjectData = (id: number) => {
        return {
            wordId: id,
            inputText: "",
            wordRU: inData.words_ru[id % inData.words_ru.length],
        };
    };

    const handleTextChange = (value: string) => {
        setLexisSelectedItemField({ inputText: value });
    };

    const nextWord = (e: React.MouseEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (inData[aliasJP][item.wordId].trim() === item.inputText.trim())
            setLexisSelectedItemField({ ...getObjectData(item.wordId + 1) });
    };

    return (
        <StudentLexisTaskInterface
            name={name}
            taskTypeName="translate"
            newObjectData={{ ...getObjectData(0) }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return item.wordId === inData[aliasJP].length;
            }}
            maincontent={() => {
                return (
                    <form className="d-flex flex-column align-items-center">
                        <StudentLexisTaskTitle title="Переведи" />

                        <div className="input-group mb-3 w-auto">
                            <span className="input-group-text">{item.wordRU}</span>
                            <input
                                className="form-control"
                                value={item.inputText}
                                onChange={(e) => handleTextChange(e.target.value)}
                                placeholder="Перевод"
                                autoFocus={true}
                            />
                        </div>

                        <input type="submit" className="btn btn-success" onClick={nextWord} value="次 (дальше)" />
                    </form>
                );
            }}
        />
    );
};

export default StudentLexisTranslate;
