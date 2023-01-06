import React, { useEffect } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { LogInfo } from "libs/Logger";
import { ServerAPI_GET, ServerAPI_POST } from "libs/ServerAPI";
import { selectDrilling, setDrillingDoneTask, setDrillingInfo, setDrillingItems } from "redux/slices/drillingSlice";
import NavigateToElement from "components/NavigateToElement";
import StudentLexisNav from "../Nav/StudentLexisNav";
import StudentDrillingCard from "./Types/StudentDrillingCard";
import StudentDrillingScramble from "./Types/StudentDrillingScramble";
import StudentDrillingTranslate from "./Types/StudentDrillingTranslate";
import StudentDrillingSpace from "./Types/StudentDrillingSpace";
import StudentProgress from "components/DAH/StudentProgress";
import StudentDrillingFindPair from "./Types/StudentDrillingFindPair";
import DrillingHub from "./DrillingHub";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import StudentTimeRemaining from "components/DAH/StudentTimeRemaining";

export type GoToNextTaskCallbackType = (taskTypeName: string, percent: number) => void;

const StudentDrillingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const drilling = useAppSelector(selectDrilling);

    const goToUndoneTask = (items: any, doneTasks: any) => {
        LogInfo("goToUndoneTask", items);
        for (const taskName of Object.keys(items)) {
            LogInfo("for", taskName);
            if (Object.keys(doneTasks).includes(taskName)) {
                LogInfo("in", taskName, Object.keys(doneTasks));
                continue;
            }
            navigate(taskName);
            break;
        }

        if (Object.keys(doneTasks).length) {
            ServerAPI_POST({
                url: `/api/drilling/${id}/newdonetask`,
                body: { done_tasks: doneTasks },
            });
        }

        if (Object.keys(doneTasks).length === Object.keys(items).length) {
            LogInfo("Navigate");
            navigate("");
        }
    };

    useEffect(() => {
        dispatch(setDrillingInfo(undefined));
        ServerAPI_GET({
            url: `/api/drilling/${id}`,
            onDataReceived: (data) => {
                LogInfo("Drill page data: ", data);
                dispatch(setDrillingInfo(data.drilling));
                dispatch(setDrillingItems(data.items));
                goToUndoneTask(data.items, data.drilling.try.done_tasks);
            },
            handleStatus: (res) => {
                if (res.status === 403) navigate("/");
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goToNextTaskHandle = (taskTypeName: string, percent: number) => {
        if (drilling.items === undefined) return;

        LogInfo("Go to next Task Handle", taskTypeName, percent);
        const newDoneTasks = Object.assign(structuredClone(drilling.info.try.done_tasks), { [taskTypeName]: percent });
        LogInfo(newDoneTasks);
        dispatch(setDrillingDoneTask(newDoneTasks));

        LogInfo("NDT", Object.keys(newDoneTasks));
        LogInfo("DI", Object.keys(drilling.items));
        goToUndoneTask(drilling.items, newDoneTasks);
    };

    const onBackToLesson = () => {
        navigate(`/lessons/${drilling.info.lesson_id}`);
    };

    const drawDeadlineComponent = () => {
        if (drilling.info.deadline) {
            return (
                <StudentTimeRemaining
                    deadline={drilling.info.deadline}
                    onDeadline={() => navigate(`/lessons/${drilling.info.lesson_id}`)}
                />
            );
        }
    };

    if (drilling.info === undefined) {
        return <div> Loading... </div>;
    }

    if (drilling.info.try === undefined || drilling.info.try === null || drilling.items === undefined) {
        return <div> Loading... </div>;
    }

    return (
        <div>
            <StudentProgress
                percent={(Object.keys(drilling.info.try.done_tasks).length / Object.keys(drilling.items).length) * 100}
            />
            <Button onClick={onBackToLesson}> Вернуться к уроку </Button>
            <div>
                {drilling.info.description} {drilling.info.time_limit} {drilling.info.try.start_datetime}
            </div>
            {drawDeadlineComponent()}
            <StudentLexisNav items={drilling.items} doneTasks={drilling.info.try.done_tasks} />

            <Routes>
                <Route path="/" element={<DrillingHub id={id} onBackToLesson={onBackToLesson} />} />
                <Route path="/card" element={<NavigateToElement to="../card/0" />} />
                <Route
                    path="/card/:cardId"
                    element={
                        <StudentDrillingCard inData={drilling.items.card} goToNextTaskCallback={goToNextTaskHandle} />
                    }
                />
                <Route
                    path="/findpair"
                    element={
                        <StudentDrillingFindPair
                            inData={drilling.items.findpair}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/scramble"
                    element={
                        <StudentDrillingScramble
                            inData={drilling.items.scramble}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/translate"
                    element={
                        <StudentDrillingTranslate
                            inData={drilling.items.translate}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/space"
                    element={
                        <StudentDrillingSpace inData={drilling.items.space} goToNextTaskCallback={goToNextTaskHandle} />
                    }
                />
            </Routes>
        </div>
    );
};

export default StudentDrillingPage;
