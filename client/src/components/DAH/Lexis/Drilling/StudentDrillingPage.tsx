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
import StudentLexisHub from "../StudentLexisHub";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import StudentTimeRemaining from "components/DAH/StudentTimeRemaining";

export type GoToNextTaskCallbackType = (taskTypeName: string, percent: number) => void;

type StudentLexisPageProps = {
    name: "drilling" | "hieroglyph";
    lexis: any;
    setLexisInfoCallback: (info: any) => void;
    setLexisItemsCallback: (items: any) => void;
    setLexisDoneTaskCallback: (doneTasks: any) => void;
};

const StudentLexisPage = ({
    name,
    lexis,
    setLexisInfoCallback,
    setLexisItemsCallback,
    setLexisDoneTaskCallback,
}: StudentLexisPageProps) => {
    const { id } = useParams();
    const navigate = useNavigate();

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
                url: `/api/${name}/${id}/newdonetask`,
                body: { done_tasks: doneTasks },
            });
        }

        if (Object.keys(doneTasks).length === Object.keys(items).length) {
            LogInfo("Navigate");
            navigate("");
        }
    };

    useEffect(() => {
        setLexisInfoCallback(undefined);
        ServerAPI_GET({
            url: `/api/${name}/${id}`,
            onDataReceived: (data) => {
                LogInfo(`Lexis(${name}) page data: `, data);
                setLexisInfoCallback(data[name]);
                setLexisItemsCallback(data.items);
                goToUndoneTask(data.items, data[name].try.done_tasks);
            },
            handleStatus: (res) => {
                if (res.status === 404) navigate("/");
                if (res.status === 403) navigate(`/lessons/${res.data.lesson_id}`);
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goToNextTaskHandle = (taskTypeName: string, percent: number) => {
        if (lexis.items === undefined) return;

        LogInfo("Go to next Task Handle", taskTypeName, percent);
        const newDoneTasks = Object.assign(structuredClone(lexis.info.try.done_tasks), { [taskTypeName]: percent });
        LogInfo(newDoneTasks);
        setLexisDoneTaskCallback(newDoneTasks);

        LogInfo("NDT", Object.keys(newDoneTasks));
        LogInfo("DI", Object.keys(lexis.items));
        goToUndoneTask(lexis.items, newDoneTasks);
    };

    const onBackToLesson = () => {
        navigate(`/lessons/${lexis.info.lesson_id}`);
    };

    const drawDeadlineComponent = () => {
        if (lexis.info.deadline) {
            return (
                <StudentTimeRemaining
                    deadline={lexis.info.deadline}
                    onDeadline={() => navigate(`/lessons/${lexis.info.lesson_id}`)}
                />
            );
        }
    };

    if (
        lexis.info === undefined ||
        lexis.info.try === undefined ||
        lexis.info.try === null ||
        lexis.items === undefined
    ) {
        return <div> Loading... </div>;
    }

    return (
        <div>
            <StudentProgress
                percent={(Object.keys(lexis.info.try.done_tasks).length / Object.keys(lexis.items).length) * 100}
            />
            <Button onClick={onBackToLesson}> Вернуться к уроку </Button>
            <div>
                {lexis.info.description} {lexis.info.time_limit} {lexis.info.try.start_datetime}
            </div>
            {drawDeadlineComponent()}
            <StudentLexisNav items={lexis.items} doneTasks={lexis.info.try.done_tasks} />

            <Routes>
                <Route path="/" element={<StudentLexisHub id={id} name={name} onBackToLesson={onBackToLesson} />} />
                <Route path="/card" element={<NavigateToElement to="../card/0" />} />
                <Route
                    path="/card/:cardId"
                    element={
                        <StudentDrillingCard
                            name={name}
                            inData={lexis.items.card}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/findpair"
                    element={
                        <StudentDrillingFindPair
                            name={name}
                            inData={lexis.items.findpair}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/scramble"
                    element={
                        <StudentDrillingScramble
                            name={name}
                            inData={lexis.items.scramble}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/translate"
                    element={
                        <StudentDrillingTranslate
                            name={name}
                            inData={lexis.items.translate}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/space"
                    element={
                        <StudentDrillingSpace
                            name={name}
                            inData={lexis.items.space}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
            </Routes>
        </div>
    );
};

const StudentDrillingPage = () => {
    const dispatch = useAppDispatch();
    const drilling = useAppSelector(selectDrilling);

    const setDrillingInfoHandler = (info: any) => {
        dispatch(setDrillingInfo(info));
    };

    const setDrillingItemsHandler = (items: any) => {
        dispatch(setDrillingItems(items));
    };

    const setDrillingDoneTaskHandler = (doneTasks: any) => {
        dispatch(setDrillingDoneTask(doneTasks));
    };

    return (
        <StudentLexisPage
            name="drilling"
            lexis={drilling}
            setLexisInfoCallback={setDrillingInfoHandler}
            setLexisItemsCallback={setDrillingItemsHandler}
            setLexisDoneTaskCallback={setDrillingDoneTaskHandler}
        />
    );
};

export default StudentDrillingPage;
