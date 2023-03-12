import React from "react";
import { AjaxPost } from "libs/ServerAPI";
import { Button } from "react-bootstrap";
import { LexisName } from "./Types/LexisUtils";

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
        <div>
            <div>Hub {name}</div>
            <Button onClick={endLexisHandle}> Завершить </Button>
        </div>
    );
};

export default StudentLexisHub;
