import React, { useEffect } from "react";
import { LogInfo } from "libs/Logger";
import { selectDrilling, setDrillingSelectedItem } from "redux/slices/drillingSlice";
import { Button } from "react-bootstrap";
import { GoToNextTaskCallbackType } from "../StudentDrillingPage";
import { useAppDispatch, useAppSelector } from "redux/hooks";
//import MD5 from "crypto-js/md5";

export type StudentDrillingTaskProps = {
    inData: any;
    goToNextTaskCallback: GoToNextTaskCallbackType;
};

export type StudentDrillingTaskInterfaceProps = {
    maincontent: () => React.ReactNode;
    newObjectData: any;
    goToNextTaskCallback: GoToNextTaskCallbackType;
    isTaskDone: () => boolean;
    taskTypeName: string;
    checkItem?: (item: any, taskTypeName: string) => boolean;
};

const StudentDrillingTaskInterface = ({
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
}: StudentDrillingTaskInterfaceProps) => {
    const dispatch = useAppDispatch();
    const item = useAppSelector(selectDrilling).selectedItem;

    useEffect(() => {
        LogInfo("setDrillingSelectedItem FindPair");
        //LogInfo(MD5("JP1").toString());
        dispatch(
            setDrillingSelectedItem({
                ...newObjectData,
                type: taskTypeName,
                mistakeCount: 0,
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!checkItem(item, taskTypeName)) return;

        if (isTaskDone()) {
            goToNextTaskCallback(
                taskTypeName,
                item.mistakeCount //Math.max(0, 100 - Math.round((100 / item.doneFields.length) * item.mistakeCount))
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item]);

    return (
        <div>
            {checkItem(item, taskTypeName) ? <div>{maincontent()}</div> : <div> </div>}
            <Button onClick={() => goToNextTaskCallback(taskTypeName, item.mistakeCount)}>Test Task Done</Button>
        </div>
    );
};

export default StudentDrillingTaskInterface;
