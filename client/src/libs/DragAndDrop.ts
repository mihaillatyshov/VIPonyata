import React from "react";

export type DragAndDropProps = {
    accept: string;
};

type DragToSpreadProps = {
    accept: string;
    data?: any;
    onDragStartCallback?: () => void;
    onDragEndCallback?: () => void;
    onDragLeaveCallback?: () => void;
    onDragOverCallback?: () => void;
};

type DropToSpreadProps = {
    accept: string;
    onDragOverCallback?: () => void;
    onDropCallback?: (dragData: any) => void;
};

export const getDragToSpread = ({
    accept,
    data = undefined,
    onDragStartCallback,
    onDragEndCallback,
    onDragLeaveCallback,
    onDragOverCallback,
}: DragToSpreadProps) => {
    return {
        draggable: true,
        onDragStart: (event: React.DragEvent<HTMLDivElement>) => {
            onDragStartCallback && onDragStartCallback();
            event.dataTransfer.setData("accept", accept);
            event.dataTransfer.setData("data", JSON.stringify(data));
        },
        onDragEnd: (event: React.DragEvent<HTMLDivElement>) => {
            onDragEndCallback && onDragEndCallback();
            console.log("DnD End");
        },
        onDragLeave: (event: React.DragEvent<HTMLDivElement>) => {
            onDragLeaveCallback && onDragLeaveCallback();
            console.log("DnD Leave");
        },
        onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
            onDragOverCallback && onDragOverCallback();
            console.log("DnD Over");
        },
    };
};

export const getDropToSpread = ({ accept, onDragOverCallback, onDropCallback }: DropToSpreadProps) => {
    return {
        onDrop: (event: React.DragEvent<HTMLDivElement>) => {
            const dragAccept = event.dataTransfer.getData("accept");
            const dragData = JSON.parse(event.dataTransfer.getData("data"));

            if (accept !== dragAccept) {
                return;
            }

            onDropCallback && onDropCallback(dragData);
            console.log("DnD Drop", accept);
        },
        onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            onDragOverCallback && onDragOverCallback();
            console.log("DnD Over (Drop)");
        },
    };
};
