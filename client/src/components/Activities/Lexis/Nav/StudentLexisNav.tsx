import React from "react";

import { LexisImages } from "models/Activity/ILexis";

import StudentLexisNavItem from "./StudentLexisNavItem";

export type StudentLexisNavProps = {
    // TODO: Remove any
    items: any;
    doneTasks: any;
    habUrl: string;
};

const StudentLexisNav = ({ items, doneTasks, habUrl }: StudentLexisNavProps) => {
    const createItem = (taskName: string, name: string, to: string, imgSrc: string) => {
        return {
            [taskName]: {
                to: to,
                name: name,
                img: imgSrc,
                mistakeCount: doneTasks[taskName],
            },
        };
    };

    const itemsData = {
        ...createItem("card", "カード", "card/0", LexisImages["card"]),
        ...createItem("findpair", "ペア", "findpair", LexisImages["findpair"]),
        ...createItem("scramble", "争う", "scramble", LexisImages["scramble"]),
        ...createItem("space", "欠落", "space", LexisImages["space"]),
        ...createItem("translate", "翻訳", "translate", LexisImages["translate"]),
    };

    return (
        <div className="container-fluid mx-0 mt-4">
            <div className="row text-center align-items-center justify-content-center mx-0">
                <StudentLexisNavItem to={habUrl} img="/img/Activity/Lexis/nav/hub.png" name="ハブ" />
                {Object.keys(items).map((taskName) => (
                    <StudentLexisNavItem key={taskName} {...itemsData[taskName]} />
                ))}
            </div>
        </div>
    );
};

export default StudentLexisNav;
