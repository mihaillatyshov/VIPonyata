import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";

interface FieldRowItemProps {
    id: number;
    field: string;
    selectedId: number | undefined;
    setSelected: (id: number | undefined) => void;
    parsCreated: number;
    alignRight?: boolean;
}

const FieldRowItem = ({ id, field, selectedId, setSelected, parsCreated, alignRight }: FieldRowItemProps) => {
    const getClassName = () => {
        return `student-assessment-find-pair__item prevent-select md-last-no-margin ${alignRight ? "right" : ""} ${
            id === selectedId ? "selected" : ""
        } ${id < parsCreated ? "done" : ""} `;
    };

    const onClickHandle = (id: number) => {
        setSelected(selectedId === undefined || selectedId !== id ? id : undefined);
    };

    return (
        <div className={getClassName()} onClick={() => onClickHandle(id)}>
            <ReactMarkdownWithHtml>{field}</ReactMarkdownWithHtml>
        </div>
    );
};

type FieldRowInItemProps = Omit<FieldRowItemProps, "id" | "parsCreated" | "alignRight">;
interface FieldRowProps {
    id: number;
    parsCreated: number;
    first: FieldRowInItemProps;
    second: FieldRowInItemProps;
}

export const FieldRow = ({ id, parsCreated, first, second }: FieldRowProps) => {
    return (
        // <div className="row student-assessment-find-pair__row">
        // <div className="student-assessment-find-pair__row">
        <>
            <FieldRowItem {...first} id={id} parsCreated={parsCreated} alignRight={true} />
            <FieldRowItem {...second} id={id} parsCreated={parsCreated} />
        </> // </div>
    );
};
