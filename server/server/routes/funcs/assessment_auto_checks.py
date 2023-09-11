from typing import Callable, Type, TypeVar

from server.models.assessment import (AssessmentTaskName, BaseModelCheck, BaseModelRes, ClassificationTaskCheck,
                                      ClassificationTaskRes, CreateSentenceTaskCheck, CreateSentenceTaskRes,
                                      FillSpacesByHandTaskRes, FillSpacesExistsTaskRes, FindPairTaskCheck,
                                      FindPairTaskRes, IFillSpacesTaskCheck, IOrderTaskCheck, ImgTaskCheck, ImgTaskRes,
                                      MultiTestTaskCheck, MultiTestTaskRes, OpenQuestionTaskCheck, OpenQuestionTaskRes,
                                      SentenceOrderTaskCheck, SentenceOrderTaskRes, SingleTestTaskCheck,
                                      SingleTestTaskRes, TextTaskCheck, TextTaskRes)


def text_task_check(_: TextTaskRes) -> TextTaskCheck:
    return TextTaskCheck()


def single_test_task_check(data: SingleTestTaskRes) -> SingleTestTaskCheck:
    if data.answer != data.meta_answer:
        return SingleTestTaskCheck(mistakes_count=1, mistake_answer=data.answer)
    return SingleTestTaskCheck()


def multi_test_task_check(data: MultiTestTaskRes) -> MultiTestTaskCheck:
    mistake_answers: list[int] = []

    for answer in data.answers:
        if answer not in data.meta_answers:
            mistake_answers.append(answer)

    for meta_answer in data.meta_answers:
        if meta_answer not in data.answers:
            mistake_answers.append(meta_answer)

    return MultiTestTaskCheck(mistakes_count=len(mistake_answers), mistake_answers=mistake_answers)


def find_pair_task_check(data: FindPairTaskRes) -> FindPairTaskCheck:
    mistakes_count = 0
    mistake_lines: list[int] = []

    for i, (first, second) in enumerate(zip(data.first, data.second)):
        if i >= data.pars_created or (first, second) not in zip(data.meta_first, data.meta_second):
            mistakes_count += 1
            mistake_lines.append(i)

    return FindPairTaskCheck(mistakes_count=mistakes_count, mistake_lines=mistake_lines)


def order_task_check(data: CreateSentenceTaskRes | SentenceOrderTaskRes) -> IOrderTaskCheck:
    mistakes_count = 0
    mistake_parts: list[int] = []

    for i, (part, meta_part) in enumerate(zip(data.parts, data.meta_parts)):
        if part != meta_part:
            mistakes_count += 1
            mistake_parts.append(i)

    return IOrderTaskCheck(mistakes_count=mistakes_count, mistake_parts=mistake_parts)


def create_sentence_task_check(data: CreateSentenceTaskRes) -> IOrderTaskCheck:
    return order_task_check(data)


def sentence_order_task_check(data: SentenceOrderTaskRes) -> IOrderTaskCheck:
    return order_task_check(data)


def fill_spaces_task_check(data: FillSpacesExistsTaskRes | FillSpacesByHandTaskRes) -> IFillSpacesTaskCheck:
    mistakes_count = 0
    mistake_answers: list[int] = []
    for i, (answer, meta_answer) in enumerate(zip(data.answers, data.meta_answers)):
        if (answer != meta_answer):
            mistakes_count += 1
            mistake_answers.append(i)

    return IFillSpacesTaskCheck(mistakes_count=mistakes_count, mistake_answers=mistake_answers)


def fill_spaces_exists_task_check(data: FillSpacesExistsTaskRes) -> IFillSpacesTaskCheck:
    return fill_spaces_task_check(data)


def fill_spaces_by_hand_task_check(data: FillSpacesByHandTaskRes) -> IFillSpacesTaskCheck:
    return fill_spaces_task_check(data)


def classification_task_check(data: ClassificationTaskRes) -> ClassificationTaskCheck:
    mistakes_count = 0
    mistake_answers: list[list[int]] = [[] for _ in data.titles]

    for col_id, (col, meta_col) in enumerate(zip(data.answers, data.meta_answers)):
        for row_id, answer in enumerate(col):
            if answer not in meta_col:
                mistakes_count += 1
                mistake_answers[col_id].append(row_id)

    return ClassificationTaskCheck(mistakes_count=mistakes_count + len(data.inputs), mistake_answers=mistake_answers)


def open_question_task_check(_: OpenQuestionTaskRes) -> OpenQuestionTaskCheck:
    return OpenQuestionTaskCheck()


def img_task_check(_: ImgTaskRes) -> ImgTaskCheck:
    return ImgTaskCheck()


# * ...
# * ...
# * ...

BMR = TypeVar('BMR', bound=BaseModelRes)
BMC = TypeVar('BMC', bound=BaseModelCheck)

Aliases: dict[str, Callable] = {}

Aliases[AssessmentTaskName.TEXT] = text_task_check
Aliases[AssessmentTaskName.TEST_SINGLE] = single_test_task_check
Aliases[AssessmentTaskName.TEST_MULTI] = multi_test_task_check
Aliases[AssessmentTaskName.FIND_PAIR] = find_pair_task_check
Aliases[AssessmentTaskName.CREATE_SENTENCE] = create_sentence_task_check
Aliases[AssessmentTaskName.SENTENCE_OREDER] = sentence_order_task_check
Aliases[AssessmentTaskName.FILL_SPACES_EXISTS] = fill_spaces_exists_task_check
Aliases[AssessmentTaskName.FILL_SPACES_BY_HAND] = fill_spaces_by_hand_task_check
Aliases[AssessmentTaskName.CLASSIFICATION] = classification_task_check
Aliases[AssessmentTaskName.OPEN_QUESTION] = open_question_task_check
Aliases[AssessmentTaskName.IMG] = img_task_check

# Check Aliases
for name in AssessmentTaskName:
    if name.value not in Aliases.keys():
        raise KeyError(f"Alias {name} not found")