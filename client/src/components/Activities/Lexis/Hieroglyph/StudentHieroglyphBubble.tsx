import React from "react";
import { useDispatch } from "react-redux";
import { setHieroglyphEndByTime } from "redux/slices/hieroglyphSlice";
import StudentActivityBubble from "components/Activities/Bouble/StudentActivityBouble";

type StudentHieroglyphBubbleProps = {
    hieroglyph: any;
};

const StudentHieroglyphBubble = ({ hieroglyph }: StudentHieroglyphBubbleProps) => {
    const dispatch = useDispatch();

    return (
        <StudentActivityBubble
            title="Иероглифы"
            info={hieroglyph.info}
            name="hieroglyph"
            onDeadline={() => dispatch(setHieroglyphEndByTime())}
        />
    );
};

export default StudentHieroglyphBubble;
