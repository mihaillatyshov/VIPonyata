import React from "react";

import { TTranslate } from "models/Activity/Items/TLexisItems";
import { Button } from "react-bootstrap";

import { StudentLexisTaskProps, useLexisItem, useLexisWordsOrChars, useSetLexisSelectedItemField } from "./LexisUtils";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";

const StudentLexisTranslate = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TTranslate>) => {
    const item = useLexisItem(name);
    const setLexisSelectedItemField = useSetLexisSelectedItemField(name);
    const aliasJP = useLexisWordsOrChars(name);

    const getObjectData = (id: number) => {
        return {
            wordId: id,
            inputText: "",
            wordJP: inData[aliasJP][id % inData[aliasJP].length],
        };
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLexisSelectedItemField({ inputText: e.target.value });
    };

    const nextWord = () => {
        console.log(inData.words_ru, item.inputText.trim());
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
                    <div>
                        <div>{item.wordJP}</div>
                        <div>
                            <input type="text" value={item.inputText} onChange={handleTextChange} />
                            <Button onClick={nextWord}> Next </Button>
                        </div>
                    </div>
                );
            }}
        />
    );
};

export default StudentLexisTranslate;
