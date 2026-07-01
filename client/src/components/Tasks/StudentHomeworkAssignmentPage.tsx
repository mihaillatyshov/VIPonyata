import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import StudentAssessmentAudio from "components/Activities/Assessment/Types/StudentAssessmentAudio";
import StudentAssessmentClassification from "components/Activities/Assessment/Types/StudentAssessmentClassification";
import StudentAssessmentCreateSentence from "components/Activities/Assessment/Types/StudentAssessmentCreateSentence";
import StudentAssessmentFillSpacesByHand from "components/Activities/Assessment/Types/StudentAssessmentFillSpacesByHand";
import StudentAssessmentFillSpacesExists from "components/Activities/Assessment/Types/StudentAssessmentFillSpacesExists";
import StudentAssessmentFindPair from "components/Activities/Assessment/Types/StudentAssessmentFindPair";
import StudentAssessmentImg from "components/Activities/Assessment/Types/StudentAssessmentImg";
import StudentAssessmentOpenQuestion from "components/Activities/Assessment/Types/StudentAssessmentOpenQuestion";
import StudentAssessmentSentenceOrder from "components/Activities/Assessment/Types/StudentAssessmentSentenceOrder";
import StudentAssessmentTestMulti from "components/Activities/Assessment/Types/StudentAssessmentTestMulti";
import StudentAssessmentTestSingle from "components/Activities/Assessment/Types/StudentAssessmentTestSingle";
import StudentAssessmentText from "components/Activities/Assessment/Types/StudentAssessmentText";
import { StudentAssessmentTypeProps } from "components/Activities/Assessment/Types/StudentAssessmentTypeProps";
import { validateStudentAssessmentTasksFilled } from "components/Activities/Assessment/validation/validateStudentAssessmentTasksFilled";
import StudentActivityDeadline from "components/Activities/StudentActivityDeadline";
import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import InputError from "components/Form/InputError";
import { PyErrorDict } from "libs/PyError";
import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import {
    studentAssessmentTaskRusNameAliases,
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAssessmentStudentTypeByName,
    TStudentAssessmentAnyItem,
    TStudentAssessmentItems,
    TTeacherAssessmentAnyItem,
    TTeacherAssessmentItems,
} from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectAssessment, setAssessmentInfo, setAssessmentItems } from "redux/slices/assessmentSlice";

interface HomeworkStartResponse {
    assignment: {
        id: number;
        title: string;
    } | null;
    try: {
        id: number;
        end_datetime: string | null;
    };
    items: TStudentAssessmentItems;
}

const homeworkStartRequests = new Map<number, Promise<HomeworkStartResponse>>();

const startHomeworkAssignmentRequest = (assignmentId: number) => {
    const existingRequest = homeworkStartRequests.get(assignmentId);
    if (existingRequest !== undefined) {
        return existingRequest;
    }

    const request = AjaxPost<HomeworkStartResponse>({
        url: `/api/tasks/assignments/${assignmentId}/start`,
        body: {},
    }).finally(() => {
        homeworkStartRequests.delete(assignmentId);
    });

    homeworkStartRequests.set(assignmentId, request);
    return request;
};

type TAliasProp<T extends TAssessmentItemBase> = (props: StudentAssessmentTypeProps<T>) => JSX.Element;

type TAliases = {
    [key in TAssessmentTaskName]: TAliasProp<TGetAssessmentStudentTypeByName[key]>;
};

const aliases: TAliases = {
    text: StudentAssessmentText,
    test_single: StudentAssessmentTestSingle,
    test_multi: StudentAssessmentTestMulti,
    find_pair: StudentAssessmentFindPair,
    create_sentence: StudentAssessmentCreateSentence,
    fill_spaces_exists: StudentAssessmentFillSpacesExists,
    fill_spaces_by_hand: StudentAssessmentFillSpacesByHand,
    classification: StudentAssessmentClassification,
    sentence_order: StudentAssessmentSentenceOrder,
    open_question: StudentAssessmentOpenQuestion,
    img: StudentAssessmentImg,
    audio: StudentAssessmentAudio,
    block_begin: () => <></>,
    block_end: () => <></>,
};

const fixBlockId = (blockIdRaw: string | null, blocksCount?: number): number => {
    if (blockIdRaw === null || blockIdRaw === undefined) return 0;

    const blockId = parseInt(blockIdRaw);

    if (isNaN(blockId)) {
        return 0;
    }

    if (blocksCount !== undefined && blockId >= blocksCount) {
        return blocksCount - 1;
    }

    return blockId;
};

type TBlockIconStatus = "default" | "valid" | "invalid" | "selected";

const getIconStatus = (
    blockId: number,
    currentBlockId: number,
    isNeedDrawValidation: boolean,
    isBlockHasError: boolean,
): TBlockIconStatus => {
    if (blockId === currentBlockId) return "selected";

    if (isNeedDrawValidation) {
        return isBlockHasError ? "invalid" : "valid";
    }

    return "default";
};

interface BlockIconProps {
    blockId: number;
    onClick: () => void;
    status: TBlockIconStatus;
    showUnfinishedMark: boolean;
}

const BlockIcon = ({ blockId, onClick, status, showUnfinishedMark }: BlockIconProps) => {
    const getClassByStatus = () => {
        switch (status) {
            case "valid":
                return "btn-success";
            case "invalid":
                return "btn-danger";
            case "selected":
                return "btn-primary";
            case "default":
            default:
                return "student-assessment-block-icon-default";
        }
    };

    return (
        <button
            type="button"
            className={`btn border rounded d-flex justify-content-center align-items-center position-relative ${getClassByStatus()}`}
            style={{ width: 28, height: 36 }}
            onClick={(event) => {
                onClick();
                event.currentTarget.blur();
            }}
        >
            {blockId + 1}
            {showUnfinishedMark && (
                <span
                    className="student-assessment-block-icon__unfinished-mark"
                    aria-label="Есть незаполненные задания"
                >
                    !
                </span>
            )}
        </button>
    );
};

interface TBlockItem {
    item: TTeacherAssessmentAnyItem;
    itemId: number;
}

const createBlocks = (assessmentItems: TTeacherAssessmentItems | undefined): TBlockItem[][] => {
    if (assessmentItems === undefined) {
        return [];
    }

    const blocks: TBlockItem[][] = [];
    let isItemInLastBlock = false;

    for (let i = 0; i < (assessmentItems.length || 0); i++) {
        const item = assessmentItems[i];

        if (item.name === TAssessmentTaskName.BLOCK_BEGIN) {
            isItemInLastBlock = true;
            blocks.push([]);
        } else if (item.name === TAssessmentTaskName.BLOCK_END) {
            isItemInLastBlock = false;
            blocks[blocks.length - 1].push({ item, itemId: i });
            continue;
        }

        if (isItemInLastBlock) {
            blocks[blocks.length - 1].push({ item, itemId: i });
        } else {
            blocks.push([{ item, itemId: i }]);
        }
    }

    return blocks;
};

const StudentHomeworkAssignmentPage = () => {
    const { assignmentId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams({ blockId: "0" });
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const assessment = useAppSelector(selectAssessment);
    const assignmentIdNumber = Number(assignmentId);
    const isAssignmentIdReady = Number.isInteger(assignmentIdNumber);
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [isNeedDrawFullValidation, setIsNeedDrawFullValidation] = useState(false);
    const [errors, setErrors] = useState<PyErrorDict>({ errors: {}, message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [changedBlocks, setChangedBlocks] = useState<number[]>([]);

    const blocks = useMemo(() => createBlocks(assessment.items), [assessment.items]);
    const blockIdCurrent = fixBlockId(
        searchParams.get("blockId"),
        assessment.items !== undefined ? blocks.length : undefined,
    );

    const normalizedBlockId = searchParams.get("blockId");

    useLayoutEffect(() => {
        let isDisposed = false;

        if (!isAssignmentIdReady) {
            dispatch(setAssessmentInfo(undefined));
            dispatch(setAssessmentItems(undefined));
            setChangedBlocks([]);
            setIsNeedDrawFullValidation(false);
            setErrors({ errors: {}, message: "" });
            setLoadStatus(LoadStatus.NONE);
            return;
        }

        dispatch(setAssessmentInfo(undefined));
        dispatch(setAssessmentItems(undefined));
        setChangedBlocks([]);
        setIsNeedDrawFullValidation(false);
        setErrors({ errors: {}, message: "" });

        setLoadStatus(LoadStatus.LOADING);
        startHomeworkAssignmentRequest(assignmentIdNumber)
            .then((json) => {
                if (isDisposed) {
                    return;
                }

                if (json.try.end_datetime) {
                    navigate(`/tasks/tries/${json.try.id}`, { replace: true });
                    return;
                }

                dispatch(setAssessmentInfo({ title: json.assignment?.title ?? "Задание", try: json.try }));
                dispatch(setAssessmentItems(json.items));
                setLoadStatus(LoadStatus.DONE);
            })
            .catch(() => {
                if (!isDisposed) {
                    setLoadStatus(LoadStatus.ERROR);
                }
            });

        return () => {
            isDisposed = true;
        };
    }, [assignmentIdNumber, dispatch, isAssignmentIdReady, navigate]);

    const saveCurrentState = useCallback(() => {
        if (!isAssignmentIdReady || assessment.items === undefined) {
            return Promise.resolve(undefined);
        }

        return AjaxPost({
            url: `/api/tasks/assignments/${assignmentIdNumber}/save`,
            body: { done_tasks: assessment.items },
        }).catch(() => undefined);
    }, [assessment.items, assignmentIdNumber, isAssignmentIdReady]);

    useEffect(() => {
        if (loadStatus !== LoadStatus.DONE || assessment.items === undefined) {
            return;
        }

        const timer = window.setTimeout(saveCurrentState, 2000);
        return () => window.clearTimeout(timer);
    }, [assessment.items, loadStatus, saveCurrentState]);

    useEffect(() => {
        if (loadStatus !== LoadStatus.DONE || assessment.items === undefined) {
            return;
        }

        if (!isNeedDrawFullValidation && !changedBlocks.includes(blockIdCurrent)) {
            return;
        }

        const validationResult = validateStudentAssessmentTasksFilled(assessment.items);
        if (validationResult !== undefined) {
            setErrors(validationResult);
        } else {
            setErrors({ errors: {}, message: "" });
        }
    }, [assessment.items, blockIdCurrent, changedBlocks, isNeedDrawFullValidation, loadStatus]);

    useEffect(() => {
        if (loadStatus !== LoadStatus.DONE) {
            return;
        }

        const nextBlockId = blockIdCurrent.toString();
        if (normalizedBlockId === nextBlockId) {
            return;
        }

        setSearchParams(
            (prev) => {
                const nextSearchParams = new URLSearchParams(prev);
                nextSearchParams.set("blockId", nextBlockId);
                return nextSearchParams;
            },
            { replace: true },
        );
    }, [blockIdCurrent, loadStatus, normalizedBlockId, setSearchParams]);

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить задание"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE || assessment.info === undefined || assessment.items === undefined) {
        return <Loading />;
    }

    const drawItem = <T extends TStudentAssessmentAnyItem>(item: T, taskId: number) => {
        const component = aliases[item.name] as TAliasProp<T>;
        return React.createElement(component, { data: item, taskId });
    };

    const handleFinish = () => {
        setIsNeedDrawFullValidation(true);
        const validationResult = validateStudentAssessmentTasksFilled(assessment.items);
        if (validationResult !== undefined) {
            setErrors(validationResult);
            return;
        }

        setErrors({ errors: {}, message: "" });
        setIsSubmitting(true);
        AjaxPost<{ try: { id: number } }>({
            url: `/api/tasks/assignments/${assignmentIdNumber}/end`,
            body: { done_tasks: assessment.items },
        })
            .then((json) => {
                navigate(`/tasks/tries/${json.try.id}`, { replace: true });
            })
            .finally(() => setIsSubmitting(false));
    };

    const addBlockToChanged = (blockId: number) => {
        setTimeout(() => window.scrollTo(0, 0), 0);

        if (!changedBlocks.includes(blockId)) {
            setChangedBlocks((prev) => [...prev, blockId]);
        }

        const validationResult = validateStudentAssessmentTasksFilled(assessment.items);
        if (validationResult !== undefined) {
            setErrors(validationResult);
        } else {
            setErrors({ errors: {}, message: "" });
        }
    };

    const setBlockId = (newBlockId: number) => {
        addBlockToChanged(blockIdCurrent);

        const nextBlockId = Math.max(0, Math.min(newBlockId, blocks.length - 1));
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set("blockId", nextBlockId.toString());
        setSearchParams(nextSearchParams);
    };

    const getItemBlock = (itemId: number) => {
        for (let i = 0; i < blocks.length; i++) {
            for (let j = 0; j < blocks[i].length; j++) {
                if (blocks[i][j].itemId === itemId) {
                    return i;
                }
            }
        }

        return -1;
    };

    const isBlockHasError = (blockId: number) => {
        for (let i = 0; i < blocks[blockId].length; i++) {
            if (errors.errors[`${blocks[blockId][i].itemId}`]) {
                return true;
            }
        }

        return false;
    };

    const isDrawableItem = (task: TAssessmentItemBase) => {
        return task.name !== TAssessmentTaskName.BLOCK_BEGIN && task.name !== TAssessmentTaskName.BLOCK_END;
    };

    const shouldDrawTaskValidation = (itemId: number) => {
        return (
            (isNeedDrawFullValidation || changedBlocks.includes(getItemBlock(itemId))) &&
            errors.errors[`${itemId}`] !== undefined
        );
    };

    const handleGoPrevBlock = () => {
        setBlockId(blockIdCurrent - 1);
    };

    const handleGoNextBlock = () => {
        setBlockId(blockIdCurrent + 1);
    };

    const handleGoToBlock = (newBlockId: number) => {
        setBlockId(newBlockId);
    };

    return (
        <div className="container pb-5" style={{ maxWidth: "800px" }}>
            <PageTitle title={assessment.info.title} urlBack="/" />
            <div className="student-assessment-page mt-3">
                <div className="student-assessment-header-row mt-2">
                    <div className="d-flex gap-2 flex-wrap student-assessment-block-icons">
                        {blocks.map((_, index) => (
                            <BlockIcon
                                key={index}
                                blockId={index}
                                showUnfinishedMark={isNeedDrawFullValidation && isBlockHasError(index)}
                                status={getIconStatus(
                                    index,
                                    blockIdCurrent,
                                    isNeedDrawFullValidation || changedBlocks.includes(index),
                                    isBlockHasError(index),
                                )}
                                onClick={() => {
                                    handleGoToBlock(index);
                                }}
                            />
                        ))}
                    </div>
                    {assessment.info?.deadline ? (
                        <div className="student-assessment-deadline">
                            <StudentActivityDeadline activityInfo={assessment.info} />
                        </div>
                    ) : null}
                </div>
                <hr className="student-assessment-divider" />
                <div className="student-assessment-tasks">
                    {(blocks[blockIdCurrent] ?? []).map(({ item, itemId }) =>
                        isDrawableItem(item) ? (
                            <React.Fragment key={itemId}>
                                <div
                                    className={`student-assessment-task__wrapper ${
                                        shouldDrawTaskValidation(itemId)
                                            ? "student-assessment-task__wrapper--unanswered"
                                            : ""
                                    }`}
                                >
                                    {shouldDrawTaskValidation(itemId) && (
                                        <i
                                            className="bi bi-exclamation-circle-fill student-assessment-task__warning"
                                            aria-label="Ответ не выбран"
                                        />
                                    )}
                                    {item.name !== TAssessmentTaskName.IMG && (
                                        <div className="student-assessment-task-title">
                                            {studentAssessmentTaskRusNameAliases[item.name]}
                                        </div>
                                    )}
                                    {drawItem(JSON.parse(JSON.stringify(item)), itemId)}
                                </div>
                            </React.Fragment>
                        ) : null,
                    )}
                </div>
                <div className="mb-2 d-flex space-between w-100">
                    {blockIdCurrent !== 0 && (
                        <button
                            type="button"
                            className="btn btn-secondary mt-3 me-auto student-assessment-back-btn"
                            onClick={handleGoPrevBlock}
                        >
                            Назад
                        </button>
                    )}
                    {blockIdCurrent === blocks.length - 1 ? (
                        <div className="d-flex align-items-center gap-2 ms-auto mt-3">
                            {isNeedDrawFullValidation && errors.message !== "" && (
                                <InputError className="mb-0 student-assessment-end-error" message={errors.message} />
                            )}
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={handleFinish}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Отправляем..." : "Завершить"}
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-success mt-3 ms-auto"
                            onClick={(event) => {
                                handleGoNextBlock();
                                event.currentTarget.blur();
                            }}
                        >
                            Далее
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentHomeworkAssignmentPage;
