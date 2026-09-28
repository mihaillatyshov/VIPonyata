import React, { useEffect, useMemo, useReducer, useRef } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";

import { activityQueries, saveLexisDoneTasks } from "api/activities";
import StudentProgress from "components/Activities/StudentProgress";
import Loading from "components/Common/Loading";
import PageDescription from "components/Common/PageDescription";
import PageTitle from "components/Common/PageTitle";
import NavigateToElement from "components/NavigateToElement";
import { useRedirectOnApiError } from "libs/useRedirectOnApiError";
import { TLexisDoneTasks } from "models/Activity/DoneTasks/TLexisDoneTasks";
import { LexisName } from "models/Activity/IActivity";
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

import { useQuery, useQueryClient } from "@tanstack/react-query";

import StudentActivityDeadline from "../StudentActivityDeadline";
import StudentLexisNav from "./Nav/StudentLexisNav";
import { selectedItemReducer, StudentLexisContext, StudentLexisContextValue } from "./StudentLexisContext";
import StudentLexisHub from "./StudentLexisHub";
import { StudentLexisTaskProps } from "./Types/LexisUtils";
import StudentLexisCard from "./Types/StudentLexisCard";
import StudentLexisFindPair from "./Types/StudentLexisFindPair";
import StudentLexisScramble from "./Types/StudentLexisScramble";
import StudentLexisSpace from "./Types/StudentLexisSpace";
import StudentLexisTranslate from "./Types/StudentLexisTranslate";

interface StudentLexisPageRouteProps<T> {
    taskName: LexisTaskName;
    path: string;
    component: (props: StudentLexisTaskProps<T>) => React.JSX.Element;
}

interface StudentLexisPageProps {
    name: LexisName;
    title: string;
}

interface TRouteElements {
    card: StudentLexisPageRouteProps<TCardItem>;
    findpair: StudentLexisPageRouteProps<TFindPair>;
    scramble: StudentLexisPageRouteProps<TScramble>;
    translate: StudentLexisPageRouteProps<TTranslate>;
    space: StudentLexisPageRouteProps<TSpace>;
}

const StudentLexisPage = ({ name, title }: StudentLexisPageProps) => {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedTask, setSelectedTask] = React.useState<LexisTaskName>();
    const [selectedItem, dispatchSelectedItem] = useReducer(selectedItemReducer, undefined);
    const lexisQueryOptions = activityQueries.studentLexis(name, id);
    const lexisQuery = useQuery(lexisQueryOptions);
    const isStartedRef = useRef(false);

    useRedirectOnApiError<{ lesson_id?: number }>(lexisQuery.error, (status, json) => {
        if (status === 404) return "/";
        if (status === 403) return `/lessons/${json.lesson_id}`;
        return null;
    });

    const context = useMemo<StudentLexisContextValue>(() => {
        const { queryKey } = activityQueries.studentLexis(name, id);
        const updateCardWord = (cardId: number, fields: { img?: string; association?: string }) => {
            queryClient.setQueryData(queryKey, (old) =>
                old === undefined
                    ? old
                    : {
                          ...old,
                          items: {
                              ...old.items,
                              card: old.items.card.map((card) =>
                                  card.id === cardId ? { ...card, word: { ...card.word, ...fields } } : card,
                              ),
                          },
                      },
            );
        };

        return {
            selectedItem,
            setSelectedItem: (item) => dispatchSelectedItem({ type: "set", item }),
            setSelectedItemFields: (fields) => dispatchSelectedItem({ type: "setFields", fields }),
            setCardImg: (cardId, img) => updateCardWord(cardId, { img }),
            setCardAssociation: (cardId, association) => updateCardWord(cardId, { association }),
        };
    }, [id, name, queryClient, selectedItem]);

    const setDoneTasks = (doneTasks: TLexisDoneTasks) => {
        queryClient.setQueryData(lexisQueryOptions.queryKey, (old) =>
            old === undefined
                ? old
                : { ...old, lexis: { ...old.lexis, try: { ...old.lexis.try, done_tasks: doneTasks } } },
        );
    };

    const routeElements: TRouteElements = {
        card: { taskName: LexisTaskName.CARD, path: "/card/:cardId", component: StudentLexisCard },
        findpair: { taskName: LexisTaskName.FINDPAIR, path: "/findpair", component: StudentLexisFindPair },
        scramble: { taskName: LexisTaskName.SCRAMBLE, path: "/scramble", component: StudentLexisScramble },
        translate: { taskName: LexisTaskName.TRANSLATE, path: "/translate", component: StudentLexisTranslate },
        space: { taskName: LexisTaskName.SPACE, path: "/space", component: StudentLexisSpace },
    };

    const goToUndoneTask = (items: TLexisItems, doneTasks: TLexisDoneTasks) => {
        for (const taskName of Object.keys(items)) {
            if (Object.keys(doneTasks).includes(taskName)) {
                continue;
            }
            setSelectedTask(taskName as LexisTaskName);
            navigate(taskName);
            break;
        }

        if (Object.keys(doneTasks).length) {
            // TODO Add some checks???
            saveLexisDoneTasks(name, id, doneTasks);
        }

        if (Object.keys(doneTasks).length === Object.keys(items).length) {
            navigate("");
            setSelectedTask(undefined);
        }
    };

    // После загрузки открываем первое непройденное задание.
    useEffect(() => {
        const data = lexisQuery.data;
        if (data === undefined || data.lexis === undefined || isStartedRef.current) {
            return;
        }

        isStartedRef.current = true;
        goToUndoneTask(data.items, data.lexis.try.done_tasks);
    }, [lexisQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

    const info = lexisQuery.data?.lexis;
    const items = lexisQuery.data?.items;

    if (
        info === undefined ||
        info === null ||
        info.try === undefined ||
        info.try === null ||
        items === undefined ||
        items === null
    ) {
        return (
            <div className="container d-flex flex-column justify-content-center align-items-center">
                <PageTitle title={title} />
                <Loading size="xxl" />
            </div>
        );
    }

    const goToNextTaskHandle = (taskTypeName: string, percent: number) => {
        const newDoneTasks = Object.assign(structuredClone(info.try.done_tasks), { [taskTypeName]: percent });
        setDoneTasks(newDoneTasks);

        goToUndoneTask(items, newDoneTasks);
    };

    const backToLessonHandle = () => {
        navigate(`/lessons/${info.lesson_id}`);
    };

    const habUrl = `/${name}/${info.id}`;

    return (
        <StudentLexisContext value={context}>
            <div className="container" style={{ maxWidth: "800px" }}>
                <PageTitle title={title} urlBack={`/lessons/${info.lesson_id}`} />
                <PageDescription description={info.description} className="mb-3" />

                <StudentProgress percent={(Object.keys(info.try.done_tasks).length / Object.keys(items).length) * 100}>
                    <div className="position-absolute w-100 d-flex justify-content-center" style={{ top: "0px" }}>
                        <StudentActivityDeadline activityInfo={info} />
                    </div>
                </StudentProgress>
                <StudentLexisNav
                    items={items}
                    doneTasks={info.try.done_tasks}
                    habUrl={habUrl}
                    selectedTask={selectedTask}
                    setSelectedTaskCallback={setSelectedTask}
                />
                <Routes>
                    <Route
                        path="/"
                        element={<StudentLexisHub id={id} name={name} backToLessonCallback={backToLessonHandle} />}
                    />
                    <Route path="/card" element={<NavigateToElement to="../card/0" replace />} />
                    {Object.values(routeElements).map(
                        (element: StudentLexisPageRouteProps<TLexisAnyItem>, i: number) => (
                            <Route
                                key={i}
                                path={element.path}
                                element={React.createElement(element.component, {
                                    name: name,
                                    inData: items[element.taskName] as any,
                                    goToNextTaskCallback: goToNextTaskHandle,
                                })}
                            />
                        ),
                    )}
                </Routes>
            </div>
        </StudentLexisContext>
    );
};

export default StudentLexisPage;
