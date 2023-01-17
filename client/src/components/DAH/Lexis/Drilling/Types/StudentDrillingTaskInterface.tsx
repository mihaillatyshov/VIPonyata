import React, { useEffect } from "react";
import { LogInfo } from "libs/Logger";
import { selectDrilling, setDrillingSelectedItem } from "redux/slices/drillingSlice";
import { selectHieroglyph, setHieroglyphSelectedItem } from "redux/slices/hieroglyphSlice";
import { Button } from "react-bootstrap";
import { GoToNextTaskCallbackType } from "../StudentDrillingPage";
import { useAppDispatch, useAppSelector } from "redux/hooks";
//import MD5 from "crypto-js/md5";

export type StudentDrillingTaskProps = {
    name: "drilling" | "hieroglyph";
    inData: any;
    goToNextTaskCallback: GoToNextTaskCallbackType;
};

export type StudentDrillingTaskInterfaceProps = {
    name: "drilling" | "hieroglyph";
    maincontent: () => React.ReactNode;
    newObjectData: any;
    goToNextTaskCallback: GoToNextTaskCallbackType;
    isTaskDone: () => boolean;
    taskTypeName: string;
    checkItem?: (item: any, taskTypeName: string) => boolean;
};

const GetLexisDataByName = (name: "drilling" | "hieroglyph") => {
    const dispatch = useAppDispatch();
    const drilling = useAppSelector(selectDrilling).selectedItem;
    const hieroglyph = useAppSelector(selectHieroglyph).selectedItem;

    switch (name) {
        case "drilling":
            return [
                drilling,
                (data: any) => {
                    dispatch(setDrillingSelectedItem(data));
                },
            ];
        case "hieroglyph":
            return [
                hieroglyph,
                (data: any) => {
                    dispatch(setHieroglyphSelectedItem(data));
                },
            ];
    }
};

const StudentDrillingTaskInterface = ({
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
}: StudentDrillingTaskInterfaceProps) => {
    const [item, setLexisSelectedItem] = GetLexisDataByName(name);

    useEffect(() => {
        LogInfo("setLexisSelectedItem FindPair");
        setLexisSelectedItem({
            ...newObjectData,
            type: taskTypeName,
            mistakeCount: 0,
        });
        // dispatch(
        //     setDrillingSelectedItem({
        //         ...newObjectData,
        //         type: taskTypeName,
        //         mistakeCount: 0,
        //     })
        // );

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

export default StudentDrillingTaskInterface;
