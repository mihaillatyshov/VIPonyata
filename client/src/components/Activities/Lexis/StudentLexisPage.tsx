import React, { useEffect } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { AjaxGet, AjaxPost } from "libs/ServerAPI";
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
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { DrillingState } from "redux/slices/drillingSlice";
import { HieroglyphState } from "redux/slices/hieroglyphSlice";
import {
    TLexisAnyItem,
    TCardItem,
    TFindPair,
    TLexisItems,
    TScramble,
    TSpace,
    TTranslate,
} from "models/Activity/Items/TLexisItems";
import { TLexisDoneTasks } from "models/Activity/DoneTasks/TLexisDoneTasks";

type ResponseData = {
    drilling?: TDrilling;
    hieroglyph?: THieroglyph;
    items: TLexisItems;
};

interface StudentLexisPageRouteProps<T> {
    taskName: string;
    path: string;
    component: (props: StudentLexisTaskProps<T>) => JSX.Element;
}

type StudentLexisPageProps = {
    name: LexisName;
    lexis: DrillingState | HieroglyphState;
    setLexisInfoCallback: (info: TDrilling | THieroglyph | undefined) => void;
    setLexisItemsCallback: (items: TLexisItems | undefined) => void;
    setLexisDoneTaskCallback: (doneTasks: TLexisDoneTasks | undefined) => void;
};

interface TRouteElements {
    card: StudentLexisPageRouteProps<TCardItem>;
    findpair: StudentLexisPageRouteProps<TFindPair>;
    scramble: StudentLexisPageRouteProps<TScramble>;
    translate: StudentLexisPageRouteProps<TTranslate>;
    space: StudentLexisPageRouteProps<TSpace>;
}

const StudentLexisPage = ({
    name,
    lexis,
    setLexisInfoCallback,
    setLexisItemsCallback,
    setLexisDoneTaskCallback,
}: StudentLexisPageProps) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const routeElements: TRouteElements = {
        card: { taskName: "card", path: "/card/:cardId", component: StudentLexisCard },
        findpair: { taskName: "findpair", path: "/findpair", component: StudentLexisFindPair },
        scramble: { taskName: "scramble", path: "/scramble", component: StudentLexisScramble },
        translate: { taskName: "translate", path: "/translate", component: StudentLexisTranslate },
        space: { taskName: "space", path: "/space", component: StudentLexisSpace },
    };

    const goToUndoneTask = (items: TLexisItems, doneTasks: TLexisDoneTasks) => {
        console.log("goToUndoneTask", items);
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
            console.log("Navigate");
            navigate("");
        }
    };

    useEffect(() => {
        setLexisInfoCallback(undefined);
        AjaxGet<ResponseData>({ url: `/api/${name}/${id}` })
            .then((json) => {
                const LexisInfo = json[name];
                if (LexisInfo !== undefined) {
                    setLexisInfoCallback(LexisInfo);
                    setLexisItemsCallback(json.items);
                    goToUndoneTask(json.items, LexisInfo.try.done_tasks);
                }
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    if (response.status === 404) navigate("/");
                    if (response.status === 403) navigate(`/lessons/${json.lesson_id}`);
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goToNextTaskHandle = (taskTypeName: string, percent: number) => {
        if (lexis.items === undefined) return;

        console.log("Go to next Task Handle", taskTypeName, percent);
        const newDoneTasks = Object.assign(structuredClone(lexis.info.try.done_tasks), { [taskTypeName]: percent });
        console.log(newDoneTasks);
        setLexisDoneTaskCallback(newDoneTasks);

        console.log("NDT", Object.keys(newDoneTasks));
        console.log("DI", Object.keys(lexis.items));
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
                {Object.values(routeElements).map((element: StudentLexisPageRouteProps<TLexisAnyItem>, i: number) => (
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
