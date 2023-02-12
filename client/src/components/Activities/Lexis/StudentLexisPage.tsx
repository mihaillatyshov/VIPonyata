import React, { useEffect } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { LogInfo } from "libs/Logger";
import { ServerAPI_GET, ServerAPI_POST } from "libs/ServerAPI";
import NavigateToElement from "components/NavigateToElement";
import StudentLexisNav from "./Nav/StudentLexisNav";
import StudentLexisCard from "./Types/StudentLexisCard";
import StudentLexisFindPair from "./Types/StudentLexisFindPair";
import StudentProgress from "components/Activities/StudentProgress";
import StudentLexisHub from "./StudentLexisHub";
import { LexisName, StudentLexisTaskProps } from "./Types/LexisUtils";
import StudentLexisScramble from "./Types/StudentLexisScramble";
import StudentLexisTranslate from "./Types/StudentLexisTranslate";
import StudentLexisSpace from "./Types/StudentLexisSpace";
import StudentActivityPageHeader from "../StudentActivityPageHeader";

type StudentLexisPageRouteProps = {
    taskName: string;
    path?: string;
    component: (props: StudentLexisTaskProps) => JSX.Element;
};

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

    const routeElements: StudentLexisPageRouteProps[] = [
        { taskName: "card", path: "/card/:cardId", component: StudentLexisCard },
        { taskName: "findpair", path: "/findpair", component: StudentLexisFindPair },
        { taskName: "scramble", path: "/scramble", component: StudentLexisScramble },
        { taskName: "translate", path: "/translate", component: StudentLexisTranslate },
        { taskName: "space", path: "/space", component: StudentLexisSpace },
    ];

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

    const backToLessonHandle = () => {
        navigate(`/lessons/${lexis.info.lesson_id}`);
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
            <StudentActivityPageHeader activityInfo={lexis.info} backToLessonCallback={backToLessonHandle} />
            <StudentLexisNav items={lexis.items} doneTasks={lexis.info.try.done_tasks} />
            <Routes>
                <Route
                    path="/"
                    element={<StudentLexisHub id={id} name={name} backToLessonCallback={backToLessonHandle} />}
                />
                <Route path="/card" element={<NavigateToElement to="../card/0" />} />
                {routeElements.map((element, i) => (
                    <Route
                        key={i}
                        path={element.path}
                        element={React.createElement(element.component, {
                            name: name,
                            inData: lexis.items[element.taskName],
                            goToNextTaskCallback: goToNextTaskHandle,
                        })}
                    />
                ))}
            </Routes>
        </div>
    );
};

export default StudentLexisPage;
