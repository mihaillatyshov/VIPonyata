import React from "react";

import StudentActivityBubble from "components/Activities/Bouble/StudentActivityBouble";
import { useDispatch } from "react-redux";
import { setLexisEndByTime } from "redux/slices/hieroglyphSlice";

type StudentHieroglyphBubbleProps = {
    hieroglyph: any;
};

const StudentHieroglyphBubble = ({ hieroglyph }: StudentHieroglyphBubbleProps) => {
    const dispatch = useDispatch();

    return (
        <StudentActivityBubble
            title="かんじ"
            info={hieroglyph.info}
            name="hieroglyph"
            onDeadline={() => dispatch(setLexisEndByTime())}
        />
    );
};

export default StudentHieroglyphBubble;
