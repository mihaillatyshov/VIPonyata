import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { StudentAssessmentCheckBlockModal } from "components/Activities/Assessment/StudentAssessmentCheckBlockModal";
import PageDescription from "components/Common/PageDescription";
import PageTitle from "components/Common/PageTitle";
import InputError from "components/Form/InputError";
import { PyErrorDict } from "libs/PyError";
import { AjaxGet, AjaxPost } from "libs/ServerAPI";
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
import { TAssessment } from "models/Activity/TAssessment";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectAssessment, setAssessmentInfo, setAssessmentItems } from "redux/slices/assessmentSlice";

import StudentActivityDeadline from "../StudentActivityDeadline";
import StudentAssessmentAudio from "./Types/StudentAssessmentAudio";
import StudentAssessmentClassification from "./Types/StudentAssessmentClassification";
import StudentAssessmentCreateSentence from "./Types/StudentAssessmentCreateSentence";
import StudentAssessmentFillSpacesByHand from "./Types/StudentAssessmentFillSpacesByHand";
import StudentAssessmentFillSpacesExists from "./Types/StudentAssessmentFillSpacesExists";
import StudentAssessmentFindPair from "./Types/StudentAssessmentFindPair";
import StudentAssessmentImg from "./Types/StudentAssessmentImg";
import StudentAssessmentOpenQuestion from "./Types/StudentAssessmentOpenQuestion";
import StudentAssessmentSentenceOrder from "./Types/StudentAssessmentSentenceOrder";
import StudentAssessmentTestMulti from "./Types/StudentAssessmentTestMulti";
import StudentAssessmentTestSingle from "./Types/StudentAssessmentTestSingle";
import StudentAssessmentText from "./Types/StudentAssessmentText";
import { StudentAssessmentTypeProps } from "./Types/StudentAssessmentTypeProps";
import { validateStudentAssessmentTasksFilled } from "./validation/validateStudentAssessmentTasksFilled";

// TODO: Need to refactor this file and components in it

type ResponseData = {
    assessment: TAssessment;
    items: TStudentAssessmentItems;
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
}

const BlockIcon = ({ blockId, onClick, status }: BlockIconProps) => {
    const getColorByStatus = () => {
        switch (status) {
            case "valid":
                return "btn-success";
            case "invalid":
                return "btn-danger";
            case "selected":
                return "btn-primary";
            case "default":
            default:
                return "btn-light";
        }
    };
    return (
        <button
            className={`btn border border-dark rounded d-flex justify-content-center align-items-center ${getColorByStatus()}`}
            style={{ width: 28, height: 36 }}
            onClick={onClick}
        >
            {blockId + 1}
        </button>
    );
};

// TODO: fix usage of TTeacherAssessmentAnyItem
interface TBlockItem {
    item: TTeacherAssessmentAnyItem;
    itemId: number;
}

// TODO: fix usage of TTeacherAssessmentItems
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

interface TBlockHasErrors {
    isModalOpen: boolean;
    isCheckLoading: boolean;
    continueCallback?: () => void;
}

const StudentAssessmentPage = () => {
    const { assessmentId: assessmentIdStr } = useParams();
    const [searchParams, setSearchParams] = useSearchParams({ itemId: "0" });
    const assessmentId = parseInt(assessmentIdStr || "");
    const dispatch = useAppDispatch();
    const assessment = useAppSelector(selectAssessment);
    const navigate = useNavigate();
    const [isNeedDrawFullValidation, setIsNeedDrawFullValidation] = useState(false);
    const [errors, setErrors] = useState<PyErrorDict>({ errors: {}, message: "" });
    const [serverErrorBlockIds, setServerErrorBlockIds] = useState<number[]>([]);
    const [changedBlocks, setChangedBlocks] = useState<number[]>([]);
    const [blockHasErrors, setBlockHasErrors] = useState<TBlockHasErrors>({
        isModalOpen: false,
        isCheckLoading: false,
    });

    const blocks = useMemo(() => createBlocks(assessment.items), [assessment.items]);
    const blockIdCurrent = fixBlockId(
        searchParams.get("blockId"),
        assessment.items !== undefined ? blocks.length : undefined,
    );

    useEffect(() => {
        dispatch(setAssessmentInfo(undefined));
        AjaxGet<ResponseData>({ url: `/api/assessment/${assessmentId}` })
            .then((json) => {
                dispatch(setAssessmentInfo(json.assessment));
                dispatch(setAssessmentItems(json.items));
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    if (response.status === 404) navigate("/", { replace: true });
                    if (response.status === 403) navigate(`/lessons/${json.lesson_id}`, { replace: true });
                }
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const saveCurrentState = useCallback(() => {
        return AjaxPost({
            url: `/api/assessment/${assessmentId}/newdonetasks`,
            body: { done_tasks: assessment.items },
        });
    }, [assessmentId, assessment]);

    useEffect(() => {
        const timer = setTimeout(saveCurrentState, 2000);
        return () => clearTimeout(timer);
    }, [assessment, assessmentId, saveCurrentState]);

    const backToLessonHandle = () => {
        navigate(`/lessons/${assessment.info.lesson_id}`, { replace: true });
    };

    const endAssessment = () => {
        setIsNeedDrawFullValidation(true);
        const validationFieldsFilledResult = validateStudentAssessmentTasksFilled(assessment.items);
        if (validationFieldsFilledResult !== undefined) {
            setErrors(validationFieldsFilledResult);
            return;
        }
        setErrors({ errors: {}, message: "" });
        AjaxPost({
            url: `/api/assessment/${assessmentId}/endtry`,
            body: { done_tasks: assessment.items },
        }).then(() => {
            backToLessonHandle();
        });
    };

    const addBlockToChanged = (blockId: number) => {
        setTimeout(() => window.scrollTo(0, 0), 0);
        if (!changedBlocks.includes(blockId)) {
            setChangedBlocks((prev) => [...prev, blockId]);
        }

        const validationFieldsFilledResult = validateStudentAssessmentTasksFilled(assessment.items);
        if (validationFieldsFilledResult !== undefined) {
            setErrors(validationFieldsFilledResult);
        } else {
            setErrors({ errors: {}, message: "" });
        }
    };

    const setBlockId = (newBlockId: number) => {
        addBlockToChanged(blockIdCurrent);
        searchParams.set("blockId", newBlockId.toString());
        setSearchParams(searchParams);
    };

    const checkBlockErrors = (cb: () => void) => {
        setBlockHasErrors(() => ({
            isCheckLoading: true,
            isModalOpen: false,
            continueCallback: cb,
        }));
        AjaxPost<{ isOk: boolean }>({
            url: `/api/assessment/${assessmentId}/checkblock`,
            body: { done_tasks: assessment.items, blockId: blockIdCurrent },
        })
            .then((data) => {
                // let blockHasErrors = false;
                // for (let i = 0; i < blocks[blockIdCurrent].length; i++) {
                //     if (!!errors.errors[`${blocks[blockIdCurrent][i].itemId}`]) {
                //         blockHasErrors = true;
                //         break;
                //     }
                // }
                const hasError = !data.isOk; // || blockHasErrors // This commented validation cause error (only here)
                if (!data.isOk && !serverErrorBlockIds.includes(blockIdCurrent)) {
                    setServerErrorBlockIds((prev) => [...prev, blockIdCurrent]);
                } else if (data.isOk && serverErrorBlockIds.includes(blockIdCurrent)) {
                    setServerErrorBlockIds((prev) => prev.filter((id) => id !== blockIdCurrent));
                }
                setBlockHasErrors(() => ({
                    isCheckLoading: false,
                    isModalOpen: hasError,
                    continueCallback: cb,
                }));
                if (!hasError) {
                    cb();
                }
            })
            .catch(() => {
                cb();
            });
    };

    const handleEndAssessment = () => {
        addBlockToChanged(blockIdCurrent);
        checkBlockErrors(endAssessment);
    };

    const handleGoPrevBlock = () => {
        addBlockToChanged(blockIdCurrent);
        checkBlockErrors(() => setBlockId(blockIdCurrent - 1));
    };

    const handleGoNextBlock = () => {
        addBlockToChanged(blockIdCurrent);
        checkBlockErrors(() => setBlockId(blockIdCurrent + 1));
    };

    const handleGoToBlock = (newBlockId: number) => {
        addBlockToChanged(blockIdCurrent);
        checkBlockErrors(() => setBlockId(newBlockId));
    };

    if (isNaN(assessmentId)) {
        navigate("/", { replace: true });
        return null;
    }

    if (blockIdCurrent !== parseInt(searchParams.get("blockId") || "")) {
        searchParams.set("blockId", blockIdCurrent.toString());
        setSearchParams(searchParams);

        return <div> Loading... </div>;
    }

    if (
        assessment.info === undefined ||
        assessment.info.try === undefined ||
        assessment.info.try === null ||
        assessment.items === undefined
    ) {
        return <div> Loading... </div>;
    }

    const drawItem = <T extends TStudentAssessmentAnyItem>(item: T, itemId: number) => {
        const component = aliases[item.name] as TAliasProp<T>;

        return React.createElement(component, { data: item, taskId: itemId });
    };

    const toDrawItems = blocks[blockIdCurrent];

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
            if (!!errors.errors[`${blocks[blockId][i].itemId}`]) {
                return true;
            }
        }
        return false;
    };

    const isDrawableItem = (task: TAssessmentItemBase) => {
        return task.name !== TAssessmentTaskName.BLOCK_BEGIN && task.name !== TAssessmentTaskName.BLOCK_END;
    };

    return (
        <div className="container pb-5" style={{ maxWidth: "800px" }}>
            <StudentAssessmentCheckBlockModal
                isShow={blockHasErrors.isModalOpen}
                close={() => setBlockHasErrors({ isModalOpen: false, isCheckLoading: false })}
                onContinueWithoutFixing={() => {
                    blockHasErrors.continueCallback !== undefined && blockHasErrors.continueCallback();
                    setBlockHasErrors({ isModalOpen: false, isCheckLoading: false });
                }}
            />
            <PageTitle title="タスク" urlBack={`/lessons/${assessment.info.lesson_id}`} />
            <PageDescription description={assessment.info.description} className="mb-1" />
            <StudentActivityDeadline activityInfo={assessment.info} />
            <div className="d-flex gap-2 flex-wrap mt-2">
                {blocks.map((_, index) => (
                    <BlockIcon
                        key={index}
                        blockId={index}
                        status={getIconStatus(
                            index,
                            blockIdCurrent,
                            isNeedDrawFullValidation || changedBlocks.includes(index),
                            isBlockHasError(index) || serverErrorBlockIds.includes(index),
                        )}
                        onClick={() => {
                            handleGoToBlock(index);
                        }}
                    />
                ))}
            </div>
            <hr />
            <div className="student-assessment-tasks">
                {toDrawItems.map(
                    ({ item, itemId }) =>
                        isDrawableItem(item) && (
                            <React.Fragment key={itemId}>
                                <div className="student-assessment-task__wrapper">
                                    {item.name !== TAssessmentTaskName.IMG && (
                                        <div className="student-assessment-task-title">
                                            {studentAssessmentTaskRusNameAliases[item.name]}
                                        </div>
                                    )}
                                    {drawItem(JSON.parse(JSON.stringify(item)), itemId)}
                                </div>
                                {(isNeedDrawFullValidation || changedBlocks.includes(getItemBlock(itemId))) &&
                                    errors.errors[`${itemId}`] !== undefined && (
                                        <InputError message={errors.errors[`${itemId}`].message} />
                                    )}
                                <hr className="my-0 py-0" />
                            </React.Fragment>
                        ),
                )}
            </div>
            <div className="mb-2 d-flex space-between w-100">
                {blockIdCurrent !== 0 && (
                    <button type="button" className="btn btn-secondary mt-3 me-auto" onClick={handleGoPrevBlock}>
                        Назад
                    </button>
                )}
                {blockIdCurrent === blocks.length - 1 ? (
                    <button type="button" className="btn btn-success mt-3" onClick={handleEndAssessment}>
                        Завершить
                    </button>
                ) : (
                    <button type="button" className="btn btn-success mt-3 ms-auto" onClick={handleGoNextBlock}>
                        Далее
                    </button>
                )}
            </div>
            {isNeedDrawFullValidation && <InputError className="mt-1 mb-5" message={errors.message} />}
        </div>
    );
};

export default StudentAssessmentPage;
