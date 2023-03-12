import React from "react";
import { Card } from "react-bootstrap";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";
import { NameTo_words_or_chars, StudentLexisTaskProps, useLexisItem, useSetLexisSelectedItemField } from "./LexisUtils";
import { TFindPair } from "models/Activity/Items/TLexisItems";
//import MD5 from "crypto-js/md5";

const StudentLexisFindPair = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TFindPair>) => {
    const item = useLexisItem(name);
    const strRU = "words_ru";
    const strJP = NameTo_words_or_chars(name);
    const setLexisSelectedItemField = useSetLexisSelectedItemField(name);

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

    const selectField = (id: number, type: "words_jp" | "words_ru" | "chars_jp") => {
        console.log("clicked", id, type);

        const otherType = type === strJP ? strRU : strJP;

        console.log("DoneFields:", item.doneFields);
        // 0. Clicked field in DoneFields array
        if (isInDoneFields(id, type)) {
            console.log("0. Clicked field in DoneFields array");
            return;
        }

        // 1. SelectedField is selected now
        if (item.selectedField.type === type && item.selectedField.id === id) {
            console.log("1. SelectedField is selected now");
            deselectField();
            return;
        }

        // 2. Selected another field with the same type OR first selection
        if (item.selectedField.type === "None" || item.selectedField.type === type) {
            console.log("2. Selected another field with the same type OR first selection");
            setLexisSelectedItemField({ selectedField: { id: id, type: type } });
            return;
        }

        // 3. Clicked field with correct id of other type in answers
        if (inData.answers[otherType][item.selectedField.id] === inData.answers[type][id]) {
            console.log("3. Clicked field with correct id of other type");
            const newField = { [otherType]: item.selectedField.id, [type]: id };
            //newField[otherType] = item.selectedField.id;
            //newField[type] = id;
            setLexisSelectedItemField({ doneFields: [...item.doneFields, newField] });
            deselectField();
            return;
        }

        // Clicked wrong answer
        console.log("3. Else");
        deselectField();
        setLexisSelectedItemField({ mistakeCount: item.mistakeCount + 1 });
    };

    const getCardClassName = (id: number, type: string) => {
        const defaultClassName = "col-auto noselect ";
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
                        <div className="row">
                            <div className="col-6">
                                <div className="container">
                                    <div className="row justify-content-end">
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
                                </div>
                            </div>

                            <div className="col-6">
                                <div className="container">
                                    <div className="row">
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
                        </div>
                    </div>
                );
            }}
        />
    );
};

export default StudentLexisFindPair;
