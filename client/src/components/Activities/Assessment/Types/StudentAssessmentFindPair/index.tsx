import React, { useEffect, useState } from "react";
import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import { TAssessmentFindPair } from "models/Activity/Items/TAssessmentItems";
import FieldsColumn from "./FieldsColumn";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

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
        <div className="row mx-0">
            <FieldsColumn
                fields={data.first}
                selectedId={selectedFirst}
                setSelectedId={setSelectedFirst}
                pars_created={data.pars_created}
            />
            <FieldsColumn
                fields={data.second}
                selectedId={selectedSecond}
                setSelectedId={setSelectedSecond}
                pars_created={data.pars_created}
            />
        </div>
    );
};

export default StudentAssessmentFindPair;
