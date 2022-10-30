import React from "react";
import { Card } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { LogInfo } from "libs/Logger";
import { setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import StudentDrillingTaskInterface from "./StudentDrillingTaskInterface";
//import MD5 from "crypto-js/md5";

const StudentDrillingFindPair = ({ inData, goToNextTaskCallback }) => {
    const dispatch = useDispatch();
    const item = useSelector((state) => state.drilling.selectedItem);
    const strWordsRU = "WordsRU";
    const strWordsJP = "WordsJP";

    const deselectField = () => {
        dispatch(setDrillingSelectedItemField({ selectedField: { id: -1, type: "None" } }));
    };

    const isInDoneFields = (id, type) => {
        for (const field of item.doneFields) {
            //LogInfo("Fileld:", field, field[type], id)
            if (field[type] === id) {
                return true;
            }
        }
        return false;
    };

    const selectField = (id, type) => {
        LogInfo("clicked", id, type);

        const otherType = type === strWordsJP ? strWordsRU : strWordsJP;

        LogInfo("DoneFields:", item.doneFields);
        // 0. Clicked field in DoneFields array
        if (isInDoneFields(id, type)) {
            LogInfo("0. Clicked field in DoneFields array");
            return;
        }

        // 1. SelectedField is selected now
        if (item.selectedField.type === type && item.selectedField.id === id) {
            LogInfo("1. SelectedField is selected now");
            deselectField();
            return;
        }

        // 2. Selected another field with the same type OR first selection
        if (item.selectedField.type === "None" || item.selectedField.type === type) {
            LogInfo("2. Selected another field with the same type OR first selection");
            dispatch(setDrillingSelectedItemField({ selectedField: { id: id, type: type } }));
            return;
        }

        // 3. Clicked field with correct id of other type in answers
        if (inData.answers[otherType][item.selectedField.id] === inData.answers[type][id]) {
            LogInfo("3. Clicked field with correct id of other type");
            let newField = {};
            newField[otherType] = item.selectedField.id;
            newField[type] = id;
            dispatch(setDrillingSelectedItemField({ doneFields: [...item.doneFields, newField] }));
            deselectField();
            return;
        }

        // Clicked wrong answer
        LogInfo("3. Else");
        deselectField();
        dispatch(setDrillingSelectedItemField({ mistakeCount: item.mistakeCount + 1 }));
    };

    const getCardClassName = (id, type) => {
        if (isInDoneFields(id, type)) return "col-auto findPairCorrect";
        if (item.selectedField.type === type && item.selectedField.id === id) return "col-auto findPairSelected";

        return "col-auto";
    };

    return (
        <StudentDrillingTaskInterface
            taskTypeName="drillingfindpair"
            newObjectData={{
                selectedField: { id: -1, type: "None" },
                doneFields: [],
            }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return item.doneFields.length === inData.answers[strWordsRU].length;
            }}
            maincontent={() => {
                return (
                    <div className="container">
                        <div className="row">
                            <div className="col-6">
                                <div className="container">
                                    <div className="row justify-content-end">
                                        {inData[strWordsJP].map((value, key) => (
                                            <Card
                                                className={getCardClassName(key, strWordsJP)}
                                                key={key}
                                                onClick={() => selectField(key, strWordsJP)}
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
                                        {inData[strWordsRU].map((value, key) => (
                                            <Card
                                                className={getCardClassName(key, strWordsRU)}
                                                key={key}
                                                onClick={() => selectField(key, strWordsRU)}
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

export default StudentDrillingFindPair;
