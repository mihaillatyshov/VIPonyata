import React from "react";
import { Card } from "react-bootstrap";

import { TFindPair } from "models/Activity/Items/TLexisItems";
import { TStudentLexisTryFindPairTask } from "models/Activity/Try/TLexisTry";

import { pickLexisWordsOrChars, StudentLexisTaskProps, useLexisItem, useSetLexisSelectedItemField } from "./LexisUtils";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";
import { StudentLexisTaskTitle } from "./StudentLexisTaskTitle";

type AvailTypes = "words_jp" | "words_ru" | "chars_jp";

const StudentLexisFindPair = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TFindPair>) => {
    const item = useLexisItem<TStudentLexisTryFindPairTask>(name);
    const strRU = "words_ru";
    const strJP = pickLexisWordsOrChars(name);
    const setLexisSelectedItemField = useSetLexisSelectedItemField<TStudentLexisTryFindPairTask>(name);

    const deselectField = () => {
        setLexisSelectedItemField({ selectedField: { id: -1, type: "None" } });
    };

    const isInDoneFields = (id: number, type: string) => {
        for (const field of item.doneFields) {
            if (field[type] === id) {
                return true;
            }
        }
        return false;
    };

    const selectField = (id: number, type: AvailTypes) => {
        const otherType = type === strJP ? strRU : strJP;

        // 0. Clicked field in DoneFields array
        if (isInDoneFields(id, type)) {
            return;
        }

        // 1. SelectedField is selected now
        if (item.selectedField.type === type && item.selectedField.id === id) {
            deselectField();
            return;
        }

        // 2. Selected another field with the same type OR first selection
        if (item.selectedField.type === "None" || item.selectedField.type === type) {
            setLexisSelectedItemField({ selectedField: { id: id, type: type } });
            return;
        }

        // 3. Clicked field with correct id of other type in answers
        // if (

        //     inData.answers[otherType].indexOf(inData.answers[type][id]) ===
        //     inData.answers[type].indexOf(inData.answers[otherType][item.selectedField.id])
        // )
        if (inData.answers[otherType][item.selectedField.id] === inData.answers[type][id]) {
            const newField = { [otherType]: item.selectedField.id, [type]: id };
            setLexisSelectedItemField({ doneFields: [...item.doneFields, newField] });
            deselectField();
            return;
        }

        // Clicked wrong answer
        deselectField();
        setLexisSelectedItemField({ mistakeCount: item.mistakeCount + 1 });
    };

    const getCardClassName = (id: number, type: string) => {
        const defaultClassName = "d-flex student-lexis-find-pair-item noselect ";
        if (isInDoneFields(id, type)) return defaultClassName + "findPairCorrect";
        if (item.selectedField.type === type && item.selectedField.id === id)
            return defaultClassName + "findPairSelected";

        return defaultClassName;
    };

    return (
        <StudentLexisTaskInterface
            name={name}
            taskTypeName="findpair"
            newObjectData={{
                selectedField: { id: -1, type: "None" },
                doneFields: [],
            }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return item.doneFields.length === inData.answers[strRU].length;
            }}
            maincontent={() => {
                return (
                    <div className="container">
                        {
                            // TODO Create other component to left and right columns
                        }
                        <StudentLexisTaskTitle title="Собери пары" />
                        <div className="row">
                            <div className="col-6 d-flex flex-column align-items-end">
                                {inData[strJP].map((value: string, key: number) => (
                                    <Card
                                        className={getCardClassName(key, strJP)}
                                        key={key}
                                        onClick={() => selectField(key, strJP)}
                                    >
                                        {value}
                                    </Card>
                                ))}
                            </div>

                            <div className="col-6 d-flex flex-column">
                                {inData[strRU].map((value: string, key: number) => (
                                    <Card
                                        className={getCardClassName(key, strRU)}
                                        key={key}
                                        onClick={() => selectField(key, strRU)}
                                    >
                                        {value}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }}
        />
    );
};

export default StudentLexisFindPair;
