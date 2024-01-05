import { IAssessmentProcessingPage } from "../ProcessingPage";

export const AssessmentEditPage = () => {
    return <IAssessmentProcessingPage title="タスク" name="assessment" processingType="edit" />;
};

export const AssessmentCreatePage = () => {
    return <IAssessmentProcessingPage title="タスク" name="assessment" processingType="create" />;
};
