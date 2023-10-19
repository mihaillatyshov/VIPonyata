import React, { useEffect } from "react";

import StudentProgress from "components/Activities/StudentProgress";
import NavigateToElement from "components/NavigateToElement";
import { AjaxGet, AjaxPost } from "libs/ServerAPI";
import { TLexisDoneTasks } from "models/Activity/DoneTasks/TLexisDoneTasks";
import { LexisTaskName } from "models/Activity/ILexis";
import {
    TCardItem,
    TFindPair,
    TLexisAnyItem,
    TLexisItems,
    TScramble,
    TSpace,
    TTranslate,
} from "models/Activity/Items/TLexisItems";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { Button } from "react-bootstrap";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { LexisState } from "redux/slices/lexis";

import StudentActivityPageHeader from "../StudentActivityPageHeader";
import StudentLexisNav from "./Nav/StudentLexisNav";
import StudentLexisHub from "./StudentLexisHub";
import { LexisName, StudentLexisTaskProps } from "./Types/LexisUtils";
import StudentLexisCard from "./Types/StudentLexisCard";
import StudentLexisFindPair from "./Types/StudentLexisFindPair";
import StudentLexisScramble from "./Types/StudentLexisScramble";
import StudentLexisSpace from "./Types/StudentLexisSpace";
import StudentLexisTranslate from "./Types/StudentLexisTranslate";

type ResponseData<T extends TDrilling | THieroglyph> = {
    lexis: T;
    items: TLexisItems;
};

interface StudentLexisPageRouteProps<T> {
    taskName: LexisTaskName;
    path: string;
    component: (props: StudentLexisTaskProps<T>) => JSX.Element;
}

interface StudentLexisPageProps<T extends TDrilling | THieroglyph> {
    name: LexisName;
    lexis: LexisState<T>;
    setLexisInfoCallback: (info: T | undefined) => void;
    setLexisItemsCallback: (items: TLexisItems | undefined) => void;
    setLexisDoneTaskCallback: (doneTasks: TLexisDoneTasks | undefined) => void;
}

interface TRouteElements {
    card: StudentLexisPageRouteProps<TCardItem>;
    findpair: StudentLexisPageRouteProps<TFindPair>;
    scramble: StudentLexisPageRouteProps<TScramble>;
    translate: StudentLexisPageRouteProps<TTranslate>;
    space: StudentLexisPageRouteProps<TSpace>;
}

const StudentLexisPage = <T extends TDrilling | THieroglyph>({
    name,
    lexis,
    setLexisInfoCallback,
    setLexisItemsCallback,
    setLexisDoneTaskCallback,
}: StudentLexisPageProps<T>) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const routeElements: TRouteElements = {
        card: { taskName: LexisTaskName.CARD, path: "/card/:cardId", component: StudentLexisCard },
        findpair: { taskName: LexisTaskName.FINDPAIR, path: "/findpair", component: StudentLexisFindPair },
        scramble: { taskName: LexisTaskName.SCRAMBLE, path: "/scramble", component: StudentLexisScramble },
        translate: { taskName: LexisTaskName.TRANSLATE, path: "/translate", component: StudentLexisTranslate },
        space: { taskName: LexisTaskName.SPACE, path: "/space", component: StudentLexisSpace },
    };

    const goToUndoneTask = (items: TLexisItems, doneTasks: TLexisDoneTasks) => {
        for (const taskName of Object.keys(items)) {
            console.log("for", taskName);
            if (Object.keys(doneTasks).includes(taskName)) {
                console.log("in", taskName, Object.keys(doneTasks));
                continue;
            }
            navigate(taskName);
            break;
        }

        if (Object.keys(doneTasks).length) {
            // TODO Add some checks???
            AjaxPost({ url: `/api/${name}/${id}/newdonetask`, body: { done_tasks: doneTasks } });
        }

        if (Object.keys(doneTasks).length === Object.keys(items).length) {
            navigate("");
        }
    };

    useEffect(() => {
        setLexisInfoCallback(undefined);
        AjaxGet<ResponseData<T>>({ url: `/api/${name}/${id}` })
            .then((json) => {
                const lexisInfo = json.lexis;
                if (lexisInfo !== undefined) {
                    setLexisInfoCallback(lexisInfo);
                    setLexisItemsCallback(json.items);
                    goToUndoneTask(json.items, lexisInfo.try.done_tasks);
                }
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    if (response.status === 404) navigate("/", { replace: true });
                    if (response.status === 403) navigate(`/lessons/${json.lesson_id}`, { replace: true });
                }
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { info, items } = lexis;

    if (
        info === undefined ||
        info === null ||
        info.try === undefined ||
        info.try === null ||
        items === undefined ||
        items === null
    )
        return <div> Loading... </div>;

    const goToNextTaskHandle = (taskTypeName: string, percent: number) => {
        if (lexis.items === undefined) return;

        console.log("Go to next Task Handle", taskTypeName, percent);
        const newDoneTasks = Object.assign(structuredClone(info.try.done_tasks), { [taskTypeName]: percent });
        console.log(newDoneTasks);
        setLexisDoneTaskCallback(newDoneTasks);

        console.log("NDT", Object.keys(newDoneTasks));
        console.log("DI", Object.keys(lexis.items));
        goToUndoneTask(lexis.items, newDoneTasks);
    };

    const backToLessonHandle = () => {
        navigate(`/lessons/${info.lesson_id}`);
    };

    return (
        <div className="container">
            <StudentActivityPageHeader activityInfo={info} backToLessonCallback={backToLessonHandle} />
            <Button onClick={() => navigate(`/${name}/${info.id}`)}> Хаб </Button>

            <div className="my-2">
                <StudentProgress
                    percent={(Object.keys(info.try.done_tasks).length / Object.keys(items).length) * 100}
                />
            </div>
            <StudentLexisNav items={lexis.items} doneTasks={info.try.done_tasks} />

            <Routes>
                <Route
                    path="/"
                    element={<StudentLexisHub id={id} name={name} backToLessonCallback={backToLessonHandle} />}
                />
                <Route path="/card" element={<NavigateToElement to="../card/0" replace />} />
                {Object.values(routeElements).map((element: StudentLexisPageRouteProps<TLexisAnyItem>, i: number) => (
                    <Route
                        key={i}
                        path={element.path}
                        element={React.createElement(element.component, {
                            name: name,
                            inData: items[element.taskName] as any,
                            goToNextTaskCallback: goToNextTaskHandle,
                        })}
                    />
                ))}
            </Routes>
        </div>
    );
};

export default StudentLexisPage;
