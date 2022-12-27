import React, { useEffect } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { LogInfo } from "libs/Logger";
import { ServerAPI_GET } from "libs/ServerAPI";
import { selectDrilling, setDrillingDoneTask, setDrillingInfo, setDrillingItems } from "redux/slices/drillingSlice";
import NavigateToElement from "components/NavigateToElement";
import StudentDrillingNav from "./Nav/StudentDrillingNav";
import StudentDrillingCard from "./Types/StudentDrillingCard";
import StudentDrillingTimeRemaining from "./StudentDrillingTimeRemaining";
import StudentDrillingScramble from "./Types/StudentDrillingScramble";
import StudentDrillingTranslate from "./Types/StudentDrillingTranslate";
import StudentDrillingSpace from "./Types/StudentDrillingSpace";
import StudentDrillingProgress from "./StudentDrillingProgress";
import StudentDrillingFindPair from "./Types/StudentDrillingFindPair";
import DrillingHub from "./DrillingHub";
import { useAppDispatch, useAppSelector } from "redux/hooks";

export type GoToNextTaskCallbackType = (taskTypeName: string, percent: number) => void;

const StudentDrillingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const drilling = useAppSelector(selectDrilling);

    const navToUndoneTask = (doneTasks: any) => {
        for (const taskName of Object.keys(drilling.items)) {
            LogInfo("for", taskName);
            if (Object.keys(doneTasks).includes(taskName)) {
                LogInfo("in", taskName, Object.keys(doneTasks));
                continue;
            }
            navigate(taskName);
            break;
        }

        // TODO Send to server what task is done

        if (Object.keys(doneTasks).length === Object.keys(drilling.items).length) {
            LogInfo("Navigate");
            navigate("");
        }
    };

    useEffect(() => {
        dispatch(setDrillingInfo(undefined));
        ServerAPI_GET({
            url: `/api/drilling/${id}`,
            onDataReceived: (data) => {
                LogInfo(data);
                dispatch(setDrillingInfo(data.drilling));
                dispatch(setDrillingItems(data.items));
                navToUndoneTask({});
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
        const newDoneTasks = Object.assign(structuredClone(drilling.info.try.DoneTasks), { [taskTypeName]: percent });
        LogInfo(newDoneTasks);
        dispatch(setDrillingDoneTask(newDoneTasks));

        // TODO Go to NextTask
        LogInfo("NDT", Object.keys(newDoneTasks));
        LogInfo("DI", Object.keys(drilling.items));
        navToUndoneTask(newDoneTasks);
    };

    const onBackToLesson = () => {
        navigate(`/lessons/${drilling.info.LessonId}`);
    };

    return (
        <div>
            {drilling.info ? (
                drilling.info.try &&
                drilling.items && (
                    <div>
                        <StudentDrillingProgress
                            percent={
                                (Object.keys(drilling.info.try.DoneTasks).length / Object.keys(drilling.items).length) *
                                100
                            }
                        />
                        <Button onClick={onBackToLesson}> Вернуться к уроку </Button>
                        <div>
                            {" "}
                            {drilling.info.Description} {drilling.info.TimeLimit} {drilling.info.try.StartTime}{" "}
                        </div>
                        {drilling.info.Deadline ? (
                            <StudentDrillingTimeRemaining
                                deadline={drilling.info.Deadline}
                                onDeadline={() => navigate(`/lessons/${drilling.info.LessonId}`)}
                            />
                        ) : (
                            <div> </div>
                        )}
                        <StudentDrillingNav items={drilling.items} doneTasks={drilling.info.try.DoneTasks} />
                        <Routes>
                            <Route path="/" element={<DrillingHub id={id} onBackToLesson={onBackToLesson} />} />
                            <Route path="/drillingcard" element={<NavigateToElement to="../drillingcard/0" />} />
                            <Route
                                path="/drillingcard/:cardId"
                                element={
                                    <StudentDrillingCard
                                        inData={drilling.items.drillingcard}
                                        goToNextTaskCallback={goToNextTaskHandle}
                                    />
                                }
                            />
                            <Route
                                path="/drillingfindpair"
                                element={
                                    <StudentDrillingFindPair
                                        inData={drilling.items.drillingfindpair}
                                        goToNextTaskCallback={goToNextTaskHandle}
                                    />
                                }
                            />
                            <Route
                                path="/drillingscramble"
                                element={
                                    <StudentDrillingScramble
                                        inData={drilling.items.drillingscramble}
                                        goToNextTaskCallback={goToNextTaskHandle}
                                    />
                                }
                            />
                            <Route
                                path="/drillingtranslate"
                                element={
                                    <StudentDrillingTranslate
                                        inData={drilling.items.drillingtranslate}
                                        goToNextTaskCallback={goToNextTaskHandle}
                                    />
                                }
                            />
                            <Route
                                path="/drillingspace"
                                element={
                                    <StudentDrillingSpace
                                        inData={drilling.items.drillingspace}
                                        goToNextTaskCallback={goToNextTaskHandle}
                                    />
                                }
                            />
                        </Routes>
                    </div>
                )
            ) : (
                <div> Loading... </div>
            )}
        </div>
    );
};

export default StudentDrillingPage;
