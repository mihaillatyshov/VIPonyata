import React from "react";

import { LexisImages } from "models/Activity/ILexis";

import StudentLexisNavItem from "./StudentLexisNavItem";

export type StudentLexisNavProps = {
    // TODO: Remove any
    items: any;
    doneTasks: any;
};

const StudentLexisNav = ({ items, doneTasks }: StudentLexisNavProps) => {
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
        ...createItem("card", "Card", "card/0", LexisImages["card"]),
        ...createItem("findpair", "Find Pair", "findpair", LexisImages["findpair"]),
        ...createItem("scramble", "Scramble", "scramble", LexisImages["scramble"]),
        ...createItem("space", "Space", "space", LexisImages["space"]),
        ...createItem("translate", "Translate", "translate", LexisImages["translate"]),
    };

    return (
        <div className="container-fluid mx-0">
            <div className="row text-center align-items-center justify-content-center  mx-0">
                {Object.keys(items).map((taskName) => (
                    <StudentLexisNavItem key={taskName} {...itemsData[taskName]} />
                ))}
            </div>
        </div>
    );
};

export default StudentLexisNav;
