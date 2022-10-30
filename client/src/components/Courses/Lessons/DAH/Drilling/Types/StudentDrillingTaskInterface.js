import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LogInfo } from "libs/Logger";
import { setDrillingSelectedItem } from "redux/slices/drillingSlice";
import { Button } from "react-bootstrap";
//import MD5 from "crypto-js/md5";

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
}) => {
    const dispatch = useDispatch();
    const item = useSelector((state) => state.drilling.selectedItem);

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
