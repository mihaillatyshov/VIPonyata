import React from "react";
import { LogInfo } from "libs/Logger";
import { Button } from "react-bootstrap";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";
import { NameTo_words_or_chars, StudentLexisTaskProps, useLexisItem, useSetLexisSelectedItemField } from "./LexisUtils";

const StudentLexisTranslate = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps) => {
    const item = useLexisItem(name);
    const setLexisSelectedItemField = useSetLexisSelectedItemField(name);
    const aliasJP = NameTo_words_or_chars(name);

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
        LogInfo(inData.words_ru, item.inputText.trim());
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
