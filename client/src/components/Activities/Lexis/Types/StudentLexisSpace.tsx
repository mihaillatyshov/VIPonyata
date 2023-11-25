import React, { useEffect, useRef } from "react";

import { TSpace } from "models/Activity/Items/TLexisItems";

import { StudentLexisTaskProps, useLexisItem, useSetLexisSelectedItemField } from "./LexisUtils";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";
import { StudentLexisTaskTitle } from "./StudentLexisTaskTitle";

interface SpaceTaskType {
    wordId: number;
    parts: string[];
    in_parts: string[];
}

const StudentLexisSpace = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TSpace>) => {
    const item = useLexisItem(name) as SpaceTaskType;
    const setLexisSelectedItemField = useSetLexisSelectedItemField(name);
    const inputElement = useRef<HTMLInputElement>(null);

    const getWordData = (id: number): SpaceTaskType => {
        const fixedId = id % inData.words.length;
        return {
            in_parts: inData.words[fixedId].parts,
            wordId: id,
            parts: inData.words[fixedId].parts,
        };
    };

    useEffect(() => {
        if (inputElement.current) {
            inputElement.current.focus();
        }
    }, [item?.in_parts]);

    useEffect(() => {
        if (inputElement.current) {
            inputElement.current.focus();
        }
    }, []);

    const nextWord = (e: React.MouseEvent<HTMLInputElement>) => {
        e.preventDefault();
        const fullInput = item.parts.map((part) => part.trim()).join("");
        if (inData.words[item.wordId].word_or_char_jp === fullInput) {
            setLexisSelectedItemField({ ...getWordData(item.wordId + 1) });
        }
    };

    const setPartValue = (partId: number, value: string) => {
        const newParts = [...item.parts];
        newParts[partId] = value;
        setLexisSelectedItemField({ parts: newParts });
    };

    const isFirst = (id: number, in_parts: string[]) => {
        return in_parts.indexOf("") === id;
    };

    return (
        <StudentLexisTaskInterface
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
                    <form className="d-flex flex-column align-items-center">
                        <StudentLexisTaskTitle title="Вставь недостающие знаки" />

                        <div className="input-group mb-3 w-auto">
                            {item.in_parts.map((part, i) =>
                                part === "" ? (
                                    <input
                                        key={i}
                                        type="text"
                                        className="form-control student-lexis-space__input"
                                        value={item.parts[i]}
                                        onChange={(e) => setPartValue(i, e.target.value)}
                                        // autoFocus={getIsFirst(i)}
                                        ref={isFirst(i, item.in_parts) ? inputElement : undefined}
                                    />
                                ) : (
                                    <span className="input-group-text" key={i}>
                                        {part}
                                    </span>
                                ),
                            )}
                        </div>
                        <input type="submit" className="btn btn-success" onClick={nextWord} value="次" />
                    </form>
                );
            }}
        />
    );
};

export default StudentLexisSpace;
