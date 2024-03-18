import React, { useEffect } from "react";

import { LexisName } from "models/Activity/IActivity";
import { TStudentLexisTryBase } from "models/Activity/Try/TLexisTry";
import { Button } from "react-bootstrap";

import { GoToNextTaskCallbackType, useLexisItem, useSetLexisSelectedItem } from "./LexisUtils";

export type StudentLexisTaskInterfaceProps<T extends TStudentLexisTryBase> = {
    name: LexisName;
    maincontent: () => React.ReactNode;
    newObjectData: Omit<T, "type" | "mistakeCount">;
    goToNextTaskCallback: GoToNextTaskCallbackType;
    isTaskDone: () => boolean;
    taskTypeName: string;
    checkItem?: (item: T, taskTypeName: string) => item is T;
};

const StudentLexisTaskInterface = <T extends TStudentLexisTryBase>({
    name,
    maincontent,
    newObjectData,
    goToNextTaskCallback,
    isTaskDone,
    taskTypeName,
    checkItem = (item, taskTypeName): item is T => {
        if (item) {
            if (item.type === taskTypeName) {
                return true;
            }
        }
        return false;
    },
}: StudentLexisTaskInterfaceProps<T>) => {
    const item = useLexisItem<T>(name);
    const setLexisSelectedItem = useSetLexisSelectedItem(name);

    useEffect(() => {
        setLexisSelectedItem({
            ...newObjectData,
            type: taskTypeName,
            mistakeCount: 0,
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!checkItem(item, taskTypeName)) return;

        if (isTaskDone()) {
            goToNextTaskCallback(
                taskTypeName,
                item.mistakeCount, //Math.max(0, 100 - Math.round((100 / item.doneFields.length) * item.mistakeCount))
            );
        }
    }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!checkItem(item, taskTypeName)) {
        return <div> Loading . . . </div>;
    }

    return (
        <div>
            {maincontent()}
            {!process.env.NODE_ENV || process.env.NODE_ENV === "development" ? (
                <Button onClick={() => goToNextTaskCallback(taskTypeName, item.mistakeCount)}>Test Task Done</Button>
            ) : null}
        </div>
    );
};

export default StudentLexisTaskInterface;
