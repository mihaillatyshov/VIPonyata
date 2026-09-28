import { useSetAssessmentTaskData } from "components/Activities/Assessment/StudentAssessmentTaskContext";
import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import InputRadioSingle from "components/Form/InputRadioSingle";
import { TAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentTestSingle = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentTestSingle>) => {
    const setAssessmentTaskData = useSetAssessmentTaskData();

    const onChangeHandler = (newId: number) => {
        setAssessmentTaskData({ id: taskId, data: { ...data, answer: newId } });
    };

    return (
        <div className="student-assessment-test">
            <div className="prevent-select md-last-pad-zero">
                <ReactMarkdownWithHtml>{data.question}</ReactMarkdownWithHtml>
            </div>

            <div className="student-assessment-test__options">
                {data.options.map((answer: string, fieldId: number) => (
                    <div key={fieldId} className="input-group">
                        <InputRadioSingle
                            key={fieldId}
                            htmlId={`radio_${taskId}_${fieldId}`}
                            id={fieldId}
                            className="input-group-text big-check"
                            placeholder={""}
                            selectedId={data.answer ?? -1}
                            onChange={onChangeHandler}
                        />
                        <div className="form-control prevent-select md-last-no-margin">
                            <ReactMarkdownWithHtml>{answer}</ReactMarkdownWithHtml>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentAssessmentTestSingle;
