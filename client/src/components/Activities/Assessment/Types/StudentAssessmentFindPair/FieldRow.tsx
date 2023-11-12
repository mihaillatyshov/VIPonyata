import React from "react";

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
        return `student-assessment-find-pair__item
        ${alignRight ? "right" : ""}
        ${id === selectedId ? "selected" : ""}
        ${id < parsCreated ? "done" : ""} `;
    };

    const onClickHandle = (id: number) => {
        setSelected(selectedId === undefined || selectedId !== id ? id : undefined);
    };

    return (
        <div className="col-6 my-2">
            <div className={getClassName()} onClick={() => onClickHandle(id)}>
                {field}
            </div>
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
        <div className="row position-relative">
            <FieldRowItem {...first} id={id} parsCreated={parsCreated} alignRight={true} />
            {id < parsCreated && <div className="student-assessment-find-pair__item-connector" />}
            <FieldRowItem {...second} id={id} parsCreated={parsCreated} />
        </div>
    );
};
