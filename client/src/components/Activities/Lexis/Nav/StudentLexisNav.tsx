import React from "react";
import { LogInfo } from "libs/Logger";
import StudentLexisNavItem from "./StudentLexisNavItem";

export type StudentLexisNavProps = {
    items: any;
    doneTasks: any;
};

const StudentLexisNav = ({ items, doneTasks }: StudentLexisNavProps) => {
    LogInfo("doneTasks:", doneTasks);
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
        ...createItem("card", "Card", "card/0", "/img/Activity/Lexis/nav/card.png"),
        ...createItem("findpair", "Find Pair", "findpair", "/img/Activity/Lexis/nav/findpair.png"),
        ...createItem("scramble", "Scramble", "scramble", "/img/Activity/Lexis/nav/scramble.png"),
        ...createItem("space", "Space", "space", "/img/Activity/Lexis/nav/space.png"),
        ...createItem("translate", "Translate", "translate", "/img/Activity/Lexis/nav/translate.png"),
    };

    LogInfo(items);

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
