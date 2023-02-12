import React from "react";
import { ServerAPI_POST } from "libs/ServerAPI";
import { Button } from "react-bootstrap";

type StudentLexisHubProps = {
    id: string | undefined;
    name: "drilling" | "hieroglyph";
    backToLessonCallback: () => void;
};

const StudentLexisHub = ({ id, name, backToLessonCallback }: StudentLexisHubProps) => {
    const endLexisHandle = () => {
        ServerAPI_POST({
            url: `/api/${name}/${id}/endtry`,
            onDataReceived: () => {
                backToLessonCallback();
            },
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
