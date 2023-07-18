import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import { GoToNextTaskCallbackType, LexisName, useLexisItem, useSetLexisSelectedItem } from "./LexisUtils";
//import MD5 from "crypto-js/md5";

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
                item.mistakeCount //Math.max(0, 100 - Math.round((100 / item.doneFields.length) * item.mistakeCount))
            );
        }
    }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!checkItem(item, taskTypeName)) {
        return <div> Loading . . . </div>;
    }

    return (
        <div>
            {maincontent()}
            <Button onClick={() => goToNextTaskCallback(taskTypeName, item.mistakeCount)}>Test Task Done</Button>
        </div>
    );
};

export default StudentLexisTaskInterface;
