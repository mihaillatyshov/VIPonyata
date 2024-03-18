import React from "react";

import { AjaxPost } from "libs/ServerAPI";
import { LexisName } from "models/Activity/IActivity";

type StudentLexisHubProps = {
    id: string | undefined;
    name: LexisName;
    backToLessonCallback: () => void;
};

const StudentLexisHub = ({ id, name, backToLessonCallback }: StudentLexisHubProps) => {
    const endLexisHandle = () => {
        AjaxPost({ url: `/api/${name}/${id}/endtry` }).then(() => {
            backToLessonCallback();
        });
    };

    return (
        <div className="d-flex flex-column align-items-center">
            <div className="">Все задания выполнены!!!</div>
            <input type="button" className="btn btn-success mt-3" onClick={endLexisHandle} value="Завершить" />
        </div>
    );
};

export default StudentLexisHub;
