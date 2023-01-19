import React, { useEffect } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { LogInfo } from "libs/Logger";
import { ServerAPI_GET, ServerAPI_POST } from "libs/ServerAPI";
import NavigateToElement from "components/NavigateToElement";
import StudentLexisNav from "./Nav/StudentLexisNav";
import StudentLexisCard from "./Types/StudentLexisCard";
import StudentLexisFindPair from "./Types/StudentLexisFindPair";
import StudentProgress from "components/DAH/StudentProgress";
import StudentLexisHub from "./StudentLexisHub";
import StudentTimeRemaining from "components/DAH/StudentTimeRemaining";
import { LexisName } from "./Types/LexisUtils";
import StudentLexisScramble from "./Types/StudentLexisScramble";
import StudentLexisTranslate from "./Types/StudentLexisTranslate";
import StudentLexisSpace from "./Types/StudentLexisSpace";

type StudentLexisPageProps = {
    name: LexisName;
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
                        <StudentLexisCard
                            name={name}
                            inData={lexis.items.card}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/findpair"
                    element={
                        <StudentLexisFindPair
                            name={name}
                            inData={lexis.items.findpair}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/scramble"
                    element={
                        <StudentLexisScramble
                            name={name}
                            inData={lexis.items.scramble}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/translate"
                    element={
                        <StudentLexisTranslate
                            name={name}
                            inData={lexis.items.translate}
                            goToNextTaskCallback={goToNextTaskHandle}
                        />
                    }
                />
                <Route
                    path="/space"
                    element={
                        <StudentLexisSpace
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

export default StudentLexisPage;
