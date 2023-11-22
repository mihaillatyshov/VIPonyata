import React, { useEffect } from "react";

import { LexisName } from "models/Activity/IActivity";
import { Button } from "react-bootstrap";

import { GoToNextTaskCallbackType, useLexisItem, useSetLexisSelectedItem } from "./LexisUtils";

export type StudentLexisTaskInterfaceProps = {
    name: LexisName;
    maincontent: () => React.ReactNode;
    newObjectData: any;
    goToNextTaskCallback: GoToNextTaskCallbackType;
    isTaskDone: () => boolean;
    taskTypeName: string;
    checkItem?: (item: any, taskTypeName: string) => boolean;
};

const StudentLexisTaskInterface = ({
    name,
    maincontent,
    newObjectData,
    goToNextTaskCallback,
    isTaskDone,
    taskTypeName,
    checkItem = (item, taskTypeName) => {
        if (item) {
            if (item.type === taskTypeName) {
                return true;
            }
        }
        return false;
    },
}: StudentLexisTaskInterfaceProps) => {
    const item = useLexisItem(name);
    const setLexisSelectedItem = useSetLexisSelectedItem(name);

    useEffect(() => {
        console.log("setLexisSelectedItem FindPair");
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
