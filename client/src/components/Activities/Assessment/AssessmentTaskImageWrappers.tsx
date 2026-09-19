import {
    TAssessmentCheckedItemBase,
    TAssessmentItemBase,
    TAssessmentTaskImageAttachment,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentTaskImageEditorControls, AssessmentTaskImageLayout } from "./AssessmentTaskImageSupport";
import { normalizeAssessmentTaskImageAttachment } from "./AssessmentTaskImageUtils";
import { AssessmentTaskPreview } from "./AssessmentTaskPreview";
import { TeacherAssessmentTypeProps } from "./ProcessingPage/Types/TeacherAssessmentTypeBase";
import { StudentAssessmentTypeProps } from "./Types/StudentAssessmentTypeProps";
import {
    AssessmentDoneTryTaskBaseProps,
    TeacherAssessmentDoneTryTaskProps,
} from "./ViewTry/Tasks/AssessmentDoneTryTaskBase";

type TAssessmentTaskWithImageAttachment = TAssessmentItemBase & TAssessmentTaskImageAttachment;

export const withTeacherAssessmentImageAttachment = <T extends TAssessmentTaskWithImageAttachment>(
    Component: (props: TeacherAssessmentTypeProps<T>) => JSX.Element,
) => {
    const WrappedComponent = (props: TeacherAssessmentTypeProps<T>) => {
        const normalizedData = normalizeAssessmentTaskImageAttachment(props.data);

        return (
            <>
                <Component {...props} data={normalizedData} />
                <AssessmentTaskImageEditorControls
                    data={normalizedData}
                    htmlId={props.taskUUID}
                    onChange={props.onChangeTask}
                />
                {normalizedData.image && (
                    <div className="mt-2">
                        <div className="assessment-task-image-editor__preview-label">Предпросмотр</div>
                        <AssessmentTaskImageLayout
                            image={normalizedData.image}
                            imageSize={normalizedData.imageSize}
                            imagePosition={normalizedData.imagePosition}
                            className="assessment-task-image-content--editor-preview"
                        >
                            <AssessmentTaskPreview
                                task={normalizedData}
                                className="assessment-task-image-editor__preview-surface"
                            />
                        </AssessmentTaskImageLayout>
                    </div>
                )}
            </>
        );
    };

    return WrappedComponent;
};

export const withStudentAssessmentImageAttachment = <T extends TAssessmentTaskWithImageAttachment>(
    Component: (props: StudentAssessmentTypeProps<T>) => JSX.Element,
) => {
    const WrappedComponent = (props: StudentAssessmentTypeProps<T>) => {
        const normalizedData = normalizeAssessmentTaskImageAttachment(props.data);

        return (
            <AssessmentTaskImageLayout
                image={normalizedData.image}
                imageSize={normalizedData.imageSize}
                imagePosition={normalizedData.imagePosition}
            >
                <Component {...props} data={normalizedData} />
            </AssessmentTaskImageLayout>
        );
    };

    return WrappedComponent;
};

type TDoneTryTaskWithImageAttachmentProps<
    T extends TAssessmentTaskWithImageAttachment,
    K extends TAssessmentCheckedItemBase,
> = AssessmentDoneTryTaskBaseProps<T, K> | TeacherAssessmentDoneTryTaskProps<T, K>;

export const withDoneTryAssessmentImageAttachment = <
    T extends TAssessmentTaskWithImageAttachment,
    K extends TAssessmentCheckedItemBase,
    P extends TDoneTryTaskWithImageAttachmentProps<T, K>,
>(
    Component: (props: P) => JSX.Element,
) => {
    const WrappedComponent = (props: P) => {
        const normalizedData = normalizeAssessmentTaskImageAttachment(props.data);

        return (
            <AssessmentTaskImageLayout
                image={normalizedData.image}
                imageSize={normalizedData.imageSize}
                imagePosition={normalizedData.imagePosition}
            >
                <Component {...props} data={normalizedData} />
            </AssessmentTaskImageLayout>
        );
    };

    return WrappedComponent;
};
