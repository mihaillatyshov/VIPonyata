import React, { useEffect, useState } from "react";

import { TAssessmentFindPair } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import { FieldRow } from "./FieldRow";

const StudentAssessmentFindPair = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentFindPair>) => {
    const [selectedFirst, setSelectedFirst] = useState<number | undefined>(undefined);
    const [selectedSecond, setSelectedSecond] = useState<number | undefined>(undefined);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (
            (selectedFirst !== undefined && selectedFirst < data.pars_created) ||
            (selectedSecond !== undefined && selectedSecond < data.pars_created)
        ) {
            const selectedId = selectedFirst !== undefined ? (selectedFirst as number) : (selectedSecond as number);
            const first = data.first.splice(selectedId, 1)[0];
            const second = data.second.splice(selectedId, 1)[0];
            data.pars_created--;
            data.first.splice(data.pars_created, 0, first);
            data.second.splice(data.pars_created, 0, second);
            setSelectedFirst(undefined);
            setSelectedSecond(undefined);
            dispatch(setAssessmentTaskData({ id: taskId, data: data }));
        } else if (selectedFirst !== undefined && selectedSecond !== undefined) {
            const first = data.first.splice(selectedFirst, 1)[0];
            const second = data.second.splice(selectedSecond, 1)[0];
            data.first.splice(data.pars_created, 0, first);
            data.second.splice(data.pars_created, 0, second);
            data.pars_created++;
            setSelectedFirst(undefined);
            setSelectedSecond(undefined);
            dispatch(setAssessmentTaskData({ id: taskId, data: data }));
        }
    }, [selectedFirst, selectedSecond]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            {data.first.map((first, i) => (
                <FieldRow
                    key={i}
                    id={i}
                    parsCreated={data.pars_created}
                    first={{
                        field: first,
                        setSelected: setSelectedFirst,
                        selectedId: selectedFirst,
                    }}
                    second={{
                        field: data.second[i],
                        setSelected: setSelectedSecond,
                        selectedId: selectedSecond,
                    }}
                />
            ))}
        </div>
    );
};

export default StudentAssessmentFindPair;
