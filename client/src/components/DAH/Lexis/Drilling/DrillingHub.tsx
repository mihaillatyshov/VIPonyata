import React from "react";
import { ServerAPI_POST } from "libs/ServerAPI";
import { Button } from "react-bootstrap";

type DrillingHubProps = {
    id: string | undefined;
    onBackToLesson: () => void;
};

const DrillingHub = ({ id, onBackToLesson }: DrillingHubProps) => {
    const onEndDrilling = () => {
        ServerAPI_POST({
            url: `/api/drilling/${id}/endtry`,
            onDataReceived: () => {
                onBackToLesson();
            },
        });
    };

    return (
        <div>
            Hub
            <Button onClick={onEndDrilling}> Завершить </Button>
        </div>
    );
};

export default DrillingHub;
