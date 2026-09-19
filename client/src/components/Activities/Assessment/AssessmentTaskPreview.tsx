import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import InputCheckSingle from "components/Form/InputCheckSingle";
import InputRadioSingle from "components/Form/InputRadioSingle";
import {
    TAssessmentFillSpacesExistsEmpty,
    TAssessmentTaskName,
    TTeacherAssessmentAnyItem,
} from "models/Activity/Items/TAssessmentItems";

import "components/Tasks/TasksShared.css";

interface AssessmentTaskPreviewProps {
    task: TTeacherAssessmentAnyItem;
    className?: string;
}

export const AssessmentTaskPreviewContent = ({ task }: { task: TTeacherAssessmentAnyItem }) => {
    switch (task.name) {
        case TAssessmentTaskName.TEXT:
            return (
                <div className="prevent-select md-last-pad-zero">
                    <ReactMarkdownWithHtml>{task.text}</ReactMarkdownWithHtml>
                </div>
            );
        case TAssessmentTaskName.TEST_SINGLE:
            return (
                <div className="student-assessment-test">
                    <div className="prevent-select md-last-pad-zero">
                        <ReactMarkdownWithHtml>{task.question || "Вопрос не заполнен"}</ReactMarkdownWithHtml>
                    </div>
                    <div className="student-assessment-test__options">
                        {task.options.map((option, index) => (
                            <div key={`${task.name}-${index}`} className="input-group">
                                <InputRadioSingle
                                    htmlId={`preview_radio_${index}`}
                                    id={index}
                                    className="input-group-text big-check"
                                    placeholder={""}
                                    selectedId={-1}
                                    isDisabled={true}
                                    onChange={() => {}}
                                />
                                <div className="form-control prevent-select md-last-no-margin">
                                    <ReactMarkdownWithHtml>{option || `Вариант ${index + 1}`}</ReactMarkdownWithHtml>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case TAssessmentTaskName.TEST_MULTI:
            return (
                <div className="student-assessment-test">
                    <div className="prevent-select md-last-pad-zero">
                        <ReactMarkdownWithHtml>{task.question || "Вопрос не заполнен"}</ReactMarkdownWithHtml>
                    </div>
                    <div className="student-assessment-test__options">
                        {task.options.map((option, index) => (
                            <div key={`${task.name}-${index}`} className="input-group">
                                <InputCheckSingle
                                    htmlId={`preview_check_${index}`}
                                    id={index}
                                    className="input-group-text big-check"
                                    placeholder={""}
                                    selectedIds={[]}
                                    isDisabled={true}
                                    onChange={() => {}}
                                />
                                <div className="form-control prevent-select md-last-no-margin">
                                    <ReactMarkdownWithHtml>{option || `Вариант ${index + 1}`}</ReactMarkdownWithHtml>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case TAssessmentTaskName.FIND_PAIR:
            return (
                <div className="student-assessment-find-pair__col">
                    {task.meta_first.map((firstItem, index) => (
                        <div key={`${task.name}-${index}`} className="student-assessment-find-pair__row">
                            <div className="student-assessment-find-pair__item prevent-select md-last-no-margin right">
                                <ReactMarkdownWithHtml>{firstItem || `Пара ${index + 1}`}</ReactMarkdownWithHtml>
                            </div>
                            <div className="student-assessment-find-pair__item prevent-select md-last-no-margin">
                                <ReactMarkdownWithHtml>{task.meta_second[index] || "-"}</ReactMarkdownWithHtml>
                            </div>
                        </div>
                    ))}
                </div>
            );
        case TAssessmentTaskName.CREATE_SENTENCE:
        case TAssessmentTaskName.SENTENCE_ORDER:
            return (
                <div className="tasks-preview-chips">
                    {(task.meta_parts.length > 0 ? task.meta_parts : ["Части не заполнены"]).map((part, index) => (
                        <span key={`${task.name}-${index}`} className="tasks-preview-chip">
                            {part || "Пустая часть"}
                        </span>
                    ))}
                </div>
            );
        case TAssessmentTaskName.FILL_SPACES_EXISTS:
            return (
                <div className="student-assessment-fill-spaces__container">
                    <div className="d-flex gap-3 flex-wrap student-assessment-fill-spaces-exists__inputs">
                        {[...task.meta_answers, ...(task.meta_extra_words ?? [])].map((answer, index) => (
                            <div
                                key={`${task.name}_input_${index}`}
                                className="d-flex dnd__sortable-item student-assessment-fill-spaces-exists__draggable"
                            >
                                <div className="prevent-select md-last-no-margin student-assessment-fill-spaces-exists__draggable-content">
                                    <ReactMarkdownWithHtml>{answer}</ReactMarkdownWithHtml>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="student-assessment-fill-spaces">
                        {task.separates.map((element, fieldId) => (
                            <>
                                <div
                                    key={`${task.name}_sep_${fieldId}`}
                                    className="prevent-select d-inline text-break me-2"
                                    style={{ whiteSpace: "normal" }}
                                >
                                    <div className="prevent-select md-last-no-margin">
                                        <ReactMarkdownWithHtml>{element}</ReactMarkdownWithHtml>
                                    </div>
                                </div>
                                {fieldId < task.separates.length - 1 && (
                                    <div key={`${task.name}_drop_${fieldId}`} className="d-inline-block me-2 mb-2">
                                        <div className="d-flex dnd__droppable-wrapper">
                                            <div className="d-flex dnd__droppable student-assessment-fill-spaces__empty">
                                                <div className="prevent-select text-center text-nowrap">
                                                    {TAssessmentFillSpacesExistsEmpty}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ))}
                    </div>
                </div>
            );
        case TAssessmentTaskName.FILL_SPACES_BY_HAND:
            return (
                <div className="student-assessment-fill-spaces">
                    {task.separates.map((element, i) => (
                        <>
                            <div key={`${task.name}_sep_${i}`} className="prevent-select md-last-no-margin">
                                <ReactMarkdownWithHtml>{element}</ReactMarkdownWithHtml>
                            </div>
                            {i < task.separates.length - 1 && (
                                <input
                                    key={`${task.name}_input_${i}`}
                                    value=""
                                    readOnly
                                    className="form-control student-assessment-fill-spaces-by-hand__input"
                                />
                            )}
                        </>
                    ))}
                </div>
            );
        case TAssessmentTaskName.CLASSIFICATION:
            return (
                <div className="student-assessment-classification__container">
                    <div className="student-assessment-classification__card inputs">
                        {task.meta_answers.flat().map((answer, index) => (
                            <div key={`${task.name}_input_${index}`}>
                                <div className="prevent-select md-last-no-margin student-assessment-classification__item student-assessment-classification__item-autosize">
                                    <ReactMarkdownWithHtml>{answer}</ReactMarkdownWithHtml>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="student-assessment-classification__answers-wrapper">
                        {task.titles.map((title, index) => (
                            <div
                                key={`${task.name}_${index}`}
                                className="student-assessment-classification__card answers"
                            >
                                <div className="student-assessment-classification__column-title">
                                    <div className="prevent-select md-last-no-margin">
                                        <ReactMarkdownWithHtml>{title || ""}</ReactMarkdownWithHtml>
                                    </div>
                                </div>
                                <div className="student-assessment-classification__hr">
                                    <div className="student-assessment-classification__item-autosize" />
                                    <hr className="m-0 p-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case TAssessmentTaskName.OPEN_QUESTION:
            return (
                <div className="student-assessment-open-question__wrapper">
                    <div className="prevent-select md-last-pad-zero mb-1">
                        <ReactMarkdownWithHtml>{task.question || "Вопрос не заполнен"}</ReactMarkdownWithHtml>
                    </div>
                    <FloatingLabelTextareaAutosize
                        value=""
                        onChangeHandler={() => {}}
                        htmlId="preview_open_question"
                        placeholder="Ответ"
                        className="student-assessment-open-question__answer"
                        rows={5}
                        noErrorField={true}
                    />
                </div>
            );
        case TAssessmentTaskName.IMG:
            return (
                <div className="d-flex flex-column gap-3 align-items-center text-center">
                    {task.url ? (
                        <img src={task.url} alt="Предпросмотр задания" className="tasks-preview-media" />
                    ) : null}
                    {task.description ? (
                        <div className="prevent-select md-last-pad-zero">
                            <ReactMarkdownWithHtml>{task.description}</ReactMarkdownWithHtml>
                        </div>
                    ) : null}
                </div>
            );
        case TAssessmentTaskName.AUDIO:
            return (
                <div className="student-assessment-audio__wrapper">
                    {task.description && (
                        <div className="student-assessment-audio__description prevent-select md-last-pad-zero">
                            <ReactMarkdownWithHtml>{task.description}</ReactMarkdownWithHtml>
                        </div>
                    )}
                    <div className="student-assessment-audio__player-wrap">
                        <audio className="student-assessment-audio__player" controls preload="metadata">
                            <source src={task.url} type="audio/mpeg"></source>
                            Your browser does not support the audio.
                        </audio>
                    </div>
                </div>
            );
        case TAssessmentTaskName.BLOCK_BEGIN:
            return <div className="tasks-preview-copy">Начало блока</div>;
        case TAssessmentTaskName.BLOCK_END:
            return <div className="tasks-preview-copy">Конец блока</div>;
        default:
            return null;
    }
};

export const AssessmentTaskPreview = ({ task, className }: AssessmentTaskPreviewProps) => {
    return (
        <div className={["tasks-preview-surface", className].filter(Boolean).join(" ")}>
            <AssessmentTaskPreviewContent task={task} />
        </div>
    );
};
