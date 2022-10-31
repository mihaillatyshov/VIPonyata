import React from "react";
import StudentDrillingNavItem from "./StudentDrillingNavItem";

type StudentDrillingNavProps = {
    items: any;
};

const StudentDrillingNav = ({ items }: StudentDrillingNavProps) => {
    const createItem = (taskName: string, name: string, to: string, imgSrc: string) => {
        return { [taskName]: { to: to, name: name, img: imgSrc } };
    };

    const itemsData = {
        ...createItem("drillingcard", "Card", "drillingcard/0", "/img/DAH/DH/nav/card.png"),
        ...createItem("drillingfindpair", "Find Pair", "drillingfindpair", "/img/DAH/DH/nav/findpair.png"),
        ...createItem("drillingscramble", "Scramble", "drillingscramble", "/img/DAH/DH/nav/scramble.png"),
        ...createItem("drillingspace", "Space", "drillingspace", "/img/DAH/DH/nav/space.png"),
        ...createItem("drillingtranslate", "Translate", "drillingtranslate", "/img/DAH/DH/nav/translate.png"),
    };

    return (
        <div className="container mx-0">
            <div className="row text-center align-items-center justify-content-center  mx-0">
                {Object.keys(items).map((taskName) => (
                    <StudentDrillingNavItem key={taskName} {...itemsData[taskName]} />
                ))}
            </div>
        </div>
    );
};

export default StudentDrillingNav;
