import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { TCardItem } from "models/Activity/Items/TLexisItems";

import { pickLexisWordOrChar, StudentLexisTaskProps, useSetLexisCardExtras } from "../LexisUtils";
import CardItem from "./CardItem";

const StudentLexisCard = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TCardItem>) => {
    const { cardId } = useParams();
    const navigate = useNavigate();

    const { setCardImg, setCardAssociation } = useSetLexisCardExtras(name);

    const cardIdInt = parseInt(cardId ?? "0");
    const taskTypeName = "card";

    const openNextCardOrDone = () => {
        if (cardIdInt + 1 < inData.length) {
            navigate(`../card/${cardIdInt + 1}`);
        } else {
            goToNextTaskCallback(taskTypeName, 0);
        }
    };

    const openPrevCard = () => {
        if (cardIdInt > 0) {
            navigate(`../card/${cardIdInt - 1}`);
        }
    };

    return (
        <CardItem
            key={cardId}
            data={inData[cardIdInt]}
            openPrevCard={openPrevCard}
            openNextCardOrDone={openNextCardOrDone}
            isFirst={cardIdInt === 0}
            isLast={cardIdInt === inData.length - 1}
            setLexisCardImg={(url: string) => setCardImg(url, inData[cardIdInt].id)}
            setLexisCardAssociation={(association: string) => setCardAssociation(association, inData[cardIdInt].id)}
            aliasJP={pickLexisWordOrChar(name)}
        />
    );
};

export default StudentLexisCard;
