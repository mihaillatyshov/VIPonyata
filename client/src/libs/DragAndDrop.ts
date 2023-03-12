import React from "react";

type DragCallbackProps = {
    dragData: any;
    setDataCallback: (data: any) => void;
};

let sharedAccept = "";
let sharedData: any = undefined;

type EventType = React.DragEvent<HTMLDivElement>;

type onDragCallbackType = ({ dragData, setDataCallback }: DragCallbackProps) => void;

type SharedDataAndCallbacks = {
    accept: string;
    onDragEnterCallback?: onDragCallbackType;
    onDragLeaveCallback?: onDragCallbackType;
    onDragOverCallback?: onDragCallbackType;
};

type DragToSpreadProps = SharedDataAndCallbacks & {
    onDragStartCallback?: onDragCallbackType;
    onDragEndCallback?: onDragCallbackType;
};

type DropToSpreadProps = SharedDataAndCallbacks & {
    onDropCallback?: onDragCallbackType;
};

const setDataHandle = (accept: string, data: any) => {
    sharedAccept = accept;
    sharedData = data;
};

const getDragData = () => {
    return sharedData;
};

const getCallbackProps = (accept: string) => {
    return {
        dragData: getDragData(),
        setDataCallback: (data: any) => setDataHandle(accept, data),
    };
};

const isAcceptable = (accept: string) => {
    return sharedAccept === accept;
};

export const getDragToSpread = ({
    accept,
    onDragStartCallback,
    onDragEndCallback,
    onDragEnterCallback,
    onDragLeaveCallback,
    onDragOverCallback,
}: DragToSpreadProps) => {
    return {
        draggable: true,
        onDragStart(event: EventType) {
            onDragStartCallback && onDragStartCallback(getCallbackProps(accept));
        },
        onDragEnd(event: EventType) {
            isAcceptable(accept) && onDragEndCallback && onDragEndCallback(getCallbackProps(accept));
        },
        onDragEnter(event: EventType) {
            isAcceptable(accept) && onDragLeaveCallback && onDragLeaveCallback(getCallbackProps(accept));
        },
        onDragLeave(event: EventType) {
            isAcceptable(accept) && onDragLeaveCallback && onDragLeaveCallback(getCallbackProps(accept));
        },
        onDragOver(event: EventType) {
            event.preventDefault();
            isAcceptable(accept) && onDragOverCallback && onDragOverCallback(getCallbackProps(accept));
        },
    };
};

export const getDropToSpread = ({
    accept,
    onDropCallback,
    onDragLeaveCallback,
    onDragOverCallback,
}: DropToSpreadProps) => {
    return {
        onDrop: (event: EventType) => {
            isAcceptable(accept) && onDropCallback && onDropCallback(getCallbackProps(accept));
        },
        onDragLeave(event: EventType) {
            isAcceptable(accept) && onDragLeaveCallback && onDragLeaveCallback(getCallbackProps(accept));
        },
        onDragOver: (event: EventType) => {
            event.preventDefault();
            isAcceptable(accept) && onDragOverCallback && onDragOverCallback(getCallbackProps(accept));
        },
    };
};
