import React from "react";

import InputText from "components/Form/InputText";
import { TTranslate } from "models/Activity/Items/TLexisItems";

import { pickLexisWordsOrChars, StudentLexisTaskProps, useLexisItem, useSetLexisSelectedItemField } from "./LexisUtils";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";
import { StudentLexisTaskTitle } from "./StudentLexisTaskTitle";

const StudentLexisTranslate = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TTranslate>) => {
    const item = useLexisItem(name);
    const setLexisSelectedItemField = useSetLexisSelectedItemField(name);
    const aliasJP = pickLexisWordsOrChars(name);

    const getObjectData = (id: number) => {
        return {
            wordId: id,
            inputText: "",
            wordJP: inData[aliasJP][id % inData[aliasJP].length],
        };
    };

    const handleTextChange = (value: string) => {
        setLexisSelectedItemField({ inputText: value });
    };

    const nextWord = (e: React.MouseEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (inData.words_ru[item.wordId] === item.inputText.trim())
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
                        <div className="mb-2">{item.wordJP}</div>
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
