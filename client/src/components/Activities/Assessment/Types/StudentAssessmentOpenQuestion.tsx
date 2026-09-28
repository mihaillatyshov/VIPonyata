import { useSetAssessmentTaskData } from "components/Activities/Assessment/StudentAssessmentTaskContext";
import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import { TAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentOpenQuestion = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentOpenQuestion>) => {
    const setAssessmentTaskData = useSetAssessmentTaskData();

    const onChangeHandler = (value: string) => {
        setAssessmentTaskData({ id: taskId, data: { ...data, answer: value } });
    };

    return (
        <div className="student-assessment-open-question__wrapper">
            <div className="prevent-select md-last-pad-zero mb-1">
                <ReactMarkdownWithHtml>{data.question}</ReactMarkdownWithHtml>
            </div>
            <FloatingLabelTextareaAutosize
                value={data.answer}
                onChangeHandler={onChangeHandler}
                htmlId={`open_question_${taskId}`}
                placeholder="Ответ"
                className="student-assessment-open-question__answer"
                rows={5}
                noErrorField
            />
        </div>
    );
};

export default StudentAssessmentOpenQuestion;
