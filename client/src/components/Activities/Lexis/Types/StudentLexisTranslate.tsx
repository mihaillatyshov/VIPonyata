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
                        <div className="mb-2">{item.wordRU}</div>
                        <InputText
                            htmlId="translate"
                            value={item.inputText}
                            onChangeHandler={handleTextChange}
                            placeholder="Перевод"
                            autoFocus={true}
                            noErrorField={true}
                        />
                        <input type="submit" className="btn btn-success mt-4" onClick={nextWord} value="次" />
                    </form>
                );
            }}
        />
    );
};

export default StudentLexisTranslate;
