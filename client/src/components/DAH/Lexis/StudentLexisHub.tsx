import React from "react";
import { ServerAPI_POST } from "libs/ServerAPI";
import { Button } from "react-bootstrap";

type StudentLexisHubProps = {
    id: string | undefined;
    name: "drilling" | "hieroglyph";
    onBackToLesson: () => void;
};

const StudentLexisHub = ({ id, name, onBackToLesson }: StudentLexisHubProps) => {
    const onEndLexis = () => {
        ServerAPI_POST({
            url: `/api/${name}/${id}/endtry`,
            onDataReceived: () => {
                onBackToLesson();
            },
        });
    };

    return (
        <div>
            <div>Hub {name}</div>
            <Button onClick={onEndLexis}> Завершить </Button>
        </div>
    );
};

export default StudentLexisHub;
