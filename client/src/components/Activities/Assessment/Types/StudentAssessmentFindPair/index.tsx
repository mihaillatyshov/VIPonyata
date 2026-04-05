import { useEffect, useState } from "react";

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
            const newData = { ...data };
            newData.pars_created--;
            newData.first.splice(newData.pars_created, 0, first);
            newData.second.splice(newData.pars_created, 0, second);
            setSelectedFirst(undefined);
            setSelectedSecond(undefined);
            dispatch(setAssessmentTaskData({ id: taskId, data: newData }));
        } else if (selectedFirst !== undefined && selectedSecond !== undefined) {
            const first = data.first.splice(selectedFirst, 1)[0];
            const second = data.second.splice(selectedSecond, 1)[0];
            const newData = { ...data };
            newData.first.splice(newData.pars_created, 0, first);
            newData.second.splice(newData.pars_created, 0, second);
            newData.pars_created++;
            setSelectedFirst(undefined);
            setSelectedSecond(undefined);
            dispatch(setAssessmentTaskData({ id: taskId, data: newData }));
        }
    }, [selectedFirst, selectedSecond]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="student-assessment-find-pair__col">
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
