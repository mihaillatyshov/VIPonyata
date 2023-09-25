import abc
import datetime
import random
import re
from enum import Enum
from typing import TypedDict

from pydantic import BaseModel, root_validator, validator


class AssessmentTaskName(str, Enum):
    TEXT = "text"
    TEST_SINGLE = "test_single"
    TEST_MULTI = "test_multi"
    CREATE_SENTENCE = "create_sentence"
    FILL_SPACES_EXISTS = "fill_spaces_exists"
    FILL_SPACES_BY_HAND = "fill_spaces_by_hand"
    FIND_PAIR = "find_pair"
    CLASSIFICATION = "classification"
    SENTENCE_OREDER = "sentence_order"
    OPEN_QUESTION = "open_question"
    IMG = "img"


ANSWER_CANT_BE_EMPTY = "Ответ не может быть пустым"
QESTION_CANT_BE_EMPTY = "Вопрос не может быть пустым"
_RE_COMBINE_WHITESPACE = re.compile(r"\s+")


#########################################################################################################################
################ Base ###################################################################################################
#########################################################################################################################
def validate_name(input_name: str, task_name: AssessmentTaskName):
    if input_name != task_name:
        raise ValueError(f"Input name : {input_name} not eq to task name: {task_name}")
    return input_name


def create_sentence_parts_validation_base(parts: list[str]):
    if len(parts) < 2:
        raise ValueError(f"Слишком мало полей ({len(parts)})")


class BaseModelTask(BaseModel, abc.ABC):
    name: AssessmentTaskName

    def student_dict(self) -> dict:
        data = {}
        for key in self.dict().keys():
            if not key.startswith("meta_"):
                data[key] = self.dict()[key]
        return data

    def student_new_dict(self) -> dict:
        return self.student_dict()

    def teacher_dict(self) -> dict:
        return self.dict()

    def combine_dict(self) -> dict:
        return self.dict(exclude={})

    class Config:
        extra = "ignore"


class BaseModelRes(BaseModelTask, abc.ABC):
    @abc.abstractmethod
    def custom_validation(self) -> bool:
        pass


class BaseModelCheck(BaseModel):
    mistakes_count: int = 0


#########################################################################################################################
################ Text ###################################################################################################
#########################################################################################################################
class TextTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.TEXT)


class TextTaskTeacherBase(TextTaskBase):
    text: str


class TextTaskStudentReq(TextTaskBase):
    pass


class TextTaskRes(TextTaskTeacherBase, BaseModelRes):
    def custom_validation(self) -> bool:
        return True


class TextTaskTeacherReq(TextTaskTeacherBase):
    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        if not values["text"]:
            raise ValueError("Текст не может быть пустым")

        return values


class TextTaskCheck(BaseModelCheck):
    pass


#########################################################################################################################
################ SingleTest #############################################################################################
#########################################################################################################################
class SingleTestTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.TEST_SINGLE)


class SingleTestTaskTeacherBase(SingleTestTaskBase):
    question: str
    options: list[str]
    meta_answer: int


class SingleTestTaskStudentReq(SingleTestTaskBase):
    answer: int | None                                                                                                  #or (self.answer > 0 and self.answer < len(self.opt))


class SingleTestTaskRes(SingleTestTaskTeacherBase, BaseModelRes):
    answer: int | None = None

    def custom_validation(self) -> bool:
        return self.answer is None or (0 <= self.answer < len(self.options))


class SingleTestTaskTeacherReq(SingleTestTaskTeacherBase):
    @validator("options", always=True)
    def options_validation(cls, v: list[str]):
        if len(v) <= 1:
            raise ValueError(f"Мало вариантов выбора ({len(v)})")
        return v

    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        meta_answer = values["meta_answer"]
        if not (0 <= meta_answer < len(values["options"])):
            raise ValueError(f"Выбран недопустимый вариант ответа ({meta_answer + 1})")

        if not values["question"]:
            raise ValueError(QESTION_CANT_BE_EMPTY)

        for option in values["options"]:
            if not option:
                raise ValueError(ANSWER_CANT_BE_EMPTY)

        return values


class SingleTestTaskCheck(BaseModelCheck):
    mistake_answer: None | int = None


#########################################################################################################################
################ MultiTest ##############################################################################################
#########################################################################################################################
class MultiTestTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.TEST_MULTI)


class MultiTestTaskTeacherBase(MultiTestTaskBase):
    question: str
    options: list[str]
    meta_answers: list[int]


class MultiTestTaskStudentReq(MultiTestTaskBase):
    answers: list[int]


class MultiTestTaskRes(MultiTestTaskTeacherBase, BaseModelRes):
    answers: list[int] = []

    def custom_validation(self) -> bool:
        if len(self.answers) != len(set(self.answers)):
            return False

        for answer in self.answers:
            if not (0 <= answer < len(self.options)):
                return False

        return True


class MultiTestTaskTeacherReq(MultiTestTaskTeacherBase):
    @validator("options", always=True)
    def options_validation(cls, v):
        if len(v) <= 1:
            raise ValueError(f"Мало вариантов выбора ({len(v)})")
        return v

    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        meta_answers = values["meta_answers"]

        if len(meta_answers) < 1:
            raise ValueError(f"Мало вариантов ответа ({len(meta_answers)})")

        if len(meta_answers) != len(set(meta_answers)):
            raise ValueError(f"Варианты ответа повторяются ({meta_answers})")

        for answer in meta_answers:
            if not (0 <= answer < len(values["options"])):
                raise ValueError(f"Варианты ответа вне диапазона ({meta_answers})")

        if not values["question"]:
            raise ValueError(QESTION_CANT_BE_EMPTY)

        for option in values["options"]:
            if not option:
                raise ValueError(ANSWER_CANT_BE_EMPTY)

        return values


class MultiTestTaskCheck(BaseModelCheck):
    mistake_answers: list[int] = []


#########################################################################################################################
################ FindPair ###############################################################################################
#########################################################################################################################
class FindPairTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.FIND_PAIR)


class FindPairTaskTeacherBase(FindPairTaskBase):
    meta_first: list[str]
    meta_second: list[str]


def find_pair_fs_validation_base(first: list[str], second: list[str]):
    if (len(first) != len(set(first))) or (len(second) != len(set(second))):
        raise ValueError("Есть повторения полей")

    if len(first) != len(second):
        raise ValueError(f"Первый и второй стоблец разной длины (f:{len(first)}, s:{len(second)})")

    if len(first) < 2:
        raise ValueError(f"Слишком мало полей {len(first)}")


class FindPairTaskStudentReq(FindPairTaskBase):
    first: list[str]
    second: list[str]
    pars_created: int

    @root_validator(skip_on_failure=True)
    def first_second_validation(cls, values: dict):
        find_pair_fs_validation_base(values["first"], values["second"])
        return values


class FindPairTaskRes(FindPairTaskTeacherBase, BaseModelRes):
    pars_created: int = 0
    first: list[str] = []
    second: list[str] = []

    @root_validator(skip_on_failure=True)
    def new_first_second_validation(cls, values: dict):
        if len(values["first"]) == 0:
            values["first"] = values["meta_first"].copy()
            random.shuffle(values["first"])

        if len(values["second"]) == 0:
            values["second"] = values["meta_second"].copy()
            random.shuffle(values["second"])

        return values

    def custom_validation(self) -> bool:
        if (len(set(self.meta_first)) != len(self.first)) or (len(set(self.meta_second)) != len(self.second)):
            return False

        if (set(self.meta_first) != set(self.first)) or (set(self.meta_second) != set(self.second)):
            return False

        return True


class FindPairTaskTeacherReq(FindPairTaskTeacherBase):
    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        find_pair_fs_validation_base(values["meta_first"], values["meta_second"])

        for first in values["meta_first"]:
            if not first:
                raise ValueError("Пустые поля в первой колонке")

        for second in values["meta_second"]:
            if not second:
                raise ValueError("Пустые поля во второй колонке")

        return values


class FindPairTaskCheck(BaseModelCheck):
    mistake_lines: list[int] = []


#########################################################################################################################
################ IOrder #################################################################################################
#########################################################################################################################
class IOrderTaskTeacherBase(BaseModelTask):
    meta_parts: list[str]


class IOrderTaskStudentReq(BaseModelTask):
    parts: list[str]

    @root_validator(skip_on_failure=True)
    def parts_validation(cls, values: dict):
        create_sentence_parts_validation_base(values["parts"])
        return values


class IOrderTaskRes(IOrderTaskTeacherBase, BaseModelRes):
    parts: list[str] = []

    @root_validator(skip_on_failure=True)
    def new_parts_validation(cls, values: dict):
        if len(values["parts"]) == 0:
            values["parts"] = values["meta_parts"].copy()
            random.shuffle(values["parts"])
        return values

    def custom_validation(self) -> bool:
        if len(self.meta_parts) != len(self.parts):
            return False

        meta_parts = self.meta_parts.copy()
        meta_parts.sort()
        parts = self.parts.copy()
        parts.sort()

        return meta_parts == parts


class IOrderTaskTeacherReq(IOrderTaskTeacherBase):
    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        create_sentence_parts_validation_base(values["meta_parts"])

        for part in values["meta_parts"]:
            if not part:
                raise ValueError("Поля не могут быть пустыми")

        return values


class IOrderTaskCheck(BaseModelCheck):
    mistake_parts: list[int] = []


#########################################################################################################################
################ CreateSentence #########################################################################################
#########################################################################################################################
class CreateSentenceTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.CREATE_SENTENCE)


class CreateSentenceTaskStudentReq(CreateSentenceTaskBase, IOrderTaskStudentReq):
    pass


class CreateSentenceTaskRes(CreateSentenceTaskBase, IOrderTaskRes):
    pass


class CreateSentenceTaskTeacherReq(CreateSentenceTaskBase, IOrderTaskTeacherReq):
    pass


class CreateSentenceTaskCheck(IOrderTaskCheck):
    pass


#########################################################################################################################
################ SentenceOrder ##########################################################################################
#########################################################################################################################
class SentenceOrderTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.SENTENCE_OREDER)


class SentenceOrderTaskStudentReq(SentenceOrderTaskBase, IOrderTaskStudentReq):
    pass


class SentenceOrderTaskRes(SentenceOrderTaskBase, IOrderTaskRes):
    pass


class SentenceOrderTaskTeacherReq(SentenceOrderTaskBase, IOrderTaskTeacherReq):
    pass


class SentenceOrderTaskCheck(IOrderTaskCheck):
    pass


# TODO combine 2 classes of FillSpaces<...>
#########################################################################################################################
################ IFillSpaces ############################################################################################
#########################################################################################################################


class IFillSpacesTaskCheck(BaseModelCheck):
    mistake_answers: list[int] = []


#########################################################################################################################
################ FillSpacesExists #######################################################################################
#########################################################################################################################
class FillSpacesExistsTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.FILL_SPACES_EXISTS)


class FillSpacesExistsTaskTeacherBase(FillSpacesExistsTaskBase):
    separates: list[str]
    meta_answers: list[str]


class FillSpacesExistsTaskStudentReq(FillSpacesExistsTaskBase):
    answers: list[str | None]
    inputs: list[str]


class FillSpacesExistsTaskRes(FillSpacesExistsTaskTeacherBase, BaseModelRes):
    answers: list[str | None] = []
    inputs: list[str] = []

    @root_validator(skip_on_failure=True)
    def new_inputs_validation(cls, values: dict):
        if len(values["answers"]) == 0:
            values["inputs"] = values["meta_answers"].copy()
            random.shuffle(values["inputs"])
            for _ in range(len(values["meta_answers"])):
                values["answers"].append(None)

        return values

    def custom_validation(self) -> bool:
        if len(self.answers) != len(self.meta_answers):
            return False

        combo_answers = [*list(filter(lambda item: item is not None, self.answers)), *self.inputs]
        combo_answers.sort()

        meta_answers = self.meta_answers.copy()
        meta_answers.sort()

        return combo_answers == meta_answers


class FillSpacesExistsTaskTeacherReq(FillSpacesExistsTaskTeacherBase):
    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        if len(values["meta_answers"]) < 2:
            raise ValueError(f"Слишком мало полей ({len(values['meta_answers'])})")

        for answer in values["meta_answers"]:
            if not answer:
                raise ValueError(ANSWER_CANT_BE_EMPTY)

        if (len(values["separates"]) - 1) != len(values["meta_answers"]):
            raise ValueError(
                f"Ответов должно быть на 1 меньше, чем разделителей (s:{len(values['separates'])}, a:{len(values['meta_answers'])})"
            )

        return values


class FillSpacesExistsTaskCheck(IFillSpacesTaskCheck):
    pass


#########################################################################################################################
################ FillSpacesByHand #######################################################################################
#########################################################################################################################
class FillSpacesByHandTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.FILL_SPACES_BY_HAND)


class FillSpacesByHandTaskTeacherBase(FillSpacesByHandTaskBase):
    separates: list[str]
    meta_answers: list[str]


class FillSpacesByHandTaskStudentReq(FillSpacesByHandTaskBase):
    answers: list[str]

    @root_validator(skip_on_failure=True)
    def answers_validation(cls, values: dict):
        # TODO: Add check for answers count
        for i in range(len(values["answers"])):
            values["answers"][i] = _RE_COMBINE_WHITESPACE.sub(" ", values["answers"][i]).strip()

        return values


class FillSpacesByHandTaskRes(FillSpacesByHandTaskTeacherBase, BaseModelRes):
    answers: list[str] = []

    @root_validator(skip_on_failure=True)
    def new_inputs_validation(cls, values: dict):
        if len(values["answers"]) == 0:
            for _ in range(len(values["meta_answers"])):
                values["answers"].append("")

        return values

    def custom_validation(self) -> bool:
        return len(self.answers) == len(self.meta_answers)


class FillSpacesByHandTaskTeacherReq(FillSpacesByHandTaskTeacherBase):
    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        if len(values["meta_answers"]) < 1:
            raise ValueError(f"Слишком мало полей ({len(values['meta_answers'])})")

        for answer in values["meta_answers"]:
            if not answer:
                raise ValueError(ANSWER_CANT_BE_EMPTY)

        if (len(values["separates"]) - 1) != len(values["meta_answers"]):
            raise ValueError(
                f"Ответов должно быть на 1 меньше, чем разделителей (s:{len(values['separates'])}, a:{len(values['meta_answers'])})"
            )

        return values


class FillSpacesByHandTaskCheck(IFillSpacesTaskCheck):
    pass


#########################################################################################################################
################ Classification #########################################################################################
#########################################################################################################################
class ClassificationTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.CLASSIFICATION)


class ClassificationTaskTeacherBase(ClassificationTaskBase):
    titles: list[str]
    meta_answers: list[list[str]]


class ClassificationTaskStudentReq(ClassificationTaskBase):
    answers: list[list[str]]
    inputs: list[str]


class ClassificationTaskRes(ClassificationTaskTeacherBase, BaseModelRes):
    answers: list[list[str]] = []
    inputs: list[str] = []

    @root_validator(skip_on_failure=True)
    def new_inputs_validation(cls, values: dict):
        print("root_validator:   ", values["answers"])
        if len(values["answers"]) == 0:
            print("len(values['answers']) == 0")
            for col in values["meta_answers"]:
                values["answers"].append([])
                values["inputs"] += col.copy()
            random.shuffle(values["inputs"])

        return values

    def custom_validation(self) -> bool:
        if len(self.answers) != len(self.meta_answers):
            return False

        combo_answers = self.inputs.copy()
        for col in self.answers:
            combo_answers += col.copy()
        combo_answers.sort()

        meta_answers = []
        for col in self.meta_answers:
            meta_answers += col.copy()
        meta_answers.sort()

        return combo_answers == meta_answers


class ClassificationTaskTeacherReq(ClassificationTaskTeacherBase):
    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        if len(values["meta_answers"]) < 1:
            raise ValueError(f"Слишком мало колонок ({len(values['meta_answers'])})")

        if len(values["meta_answers"]) != len(values["titles"]):
            raise ValueError(
                f"Количество колонок ({len(values['meta_answers'])}) не равно количеству названий ({len(values['titles'])})"
            )

        for col in values["meta_answers"]:
            if len(col) < 1:
                raise ValueError(f"Слишком мало значений в колонке ({len(col)})")

            for cell in col:
                if not cell:
                    raise ValueError("Поля не могут быть пустымы")

        for title in values["titles"]:
            if not title:
                raise ValueError("Название не может быть пустым")

        return values


class ClassificationTaskCheck(BaseModelCheck):
    mistake_answers: list[list[int]] = []


#########################################################################################################################
################ OpenQuestion ###########################################################################################
#########################################################################################################################
class OpenQuestionTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.OPEN_QUESTION)


class OpenQuestionTaskTeacherBase(OpenQuestionTaskBase):
    question: str


class OpenQuestionTaskStudentReq(OpenQuestionTaskBase):
    answer: str

    @root_validator(skip_on_failure=True)
    def answers_validation(cls, values: dict):
        values["answer"] = _RE_COMBINE_WHITESPACE.sub(" ", values["answer"]).strip()

        return values


class OpenQuestionTaskRes(OpenQuestionTaskTeacherBase, BaseModelRes):
    answer: str = ""

    def custom_validation(self) -> bool:
        return True


class OpenQuestionTaskTeacherReq(OpenQuestionTaskTeacherBase):
    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        if not values["question"]:
            raise ValueError(QESTION_CANT_BE_EMPTY)

        return values


class OpenQuestionTaskCheck(BaseModelCheck):
    pass


#########################################################################################################################
################ Img ###################################################################################################
#########################################################################################################################
class ImgTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.IMG)


class ImgTaskTeacherBase(ImgTaskBase):
    url: str


class ImgTaskStudentReq(ImgTaskBase):
    pass


class ImgTaskRes(ImgTaskTeacherBase, BaseModelRes):
    def custom_validation(self) -> bool:
        return True


class ImgTaskTeacherReq(ImgTaskTeacherBase):
    @root_validator(skip_on_failure=True)
    def validate_on_create(cls, values: dict):
        if not values["url"]:
            raise ValueError("Картинка не добавлена")

        return values


class ImgTaskCheck(BaseModelCheck):
    pass


#########################################################################################################################
################ Alias ##################################################################################################
#########################################################################################################################
class AliasType(TypedDict):
    req: type[BaseModelTask]
    res: type[BaseModelRes]
    create: type[BaseModelTask]


Aliases: dict[str, AliasType] = {}


def create_alias(name: AssessmentTaskName, req, res, create):
    Aliases[name.value] = {"req": req, "res": res, "create": create}


create_alias(AssessmentTaskName.TEXT, TextTaskStudentReq, TextTaskRes, TextTaskTeacherReq)
create_alias(AssessmentTaskName.TEST_SINGLE, SingleTestTaskStudentReq, SingleTestTaskRes, SingleTestTaskTeacherReq)
create_alias(AssessmentTaskName.TEST_MULTI, MultiTestTaskStudentReq, MultiTestTaskRes, MultiTestTaskTeacherReq)
create_alias(AssessmentTaskName.FIND_PAIR, FindPairTaskStudentReq, FindPairTaskRes, FindPairTaskTeacherReq)
create_alias(AssessmentTaskName.CREATE_SENTENCE, CreateSentenceTaskStudentReq, CreateSentenceTaskRes,
             CreateSentenceTaskTeacherReq)
create_alias(AssessmentTaskName.FILL_SPACES_EXISTS, FillSpacesExistsTaskStudentReq, FillSpacesExistsTaskRes,
             FillSpacesExistsTaskTeacherReq)
create_alias(AssessmentTaskName.FILL_SPACES_BY_HAND, FillSpacesByHandTaskStudentReq, FillSpacesByHandTaskRes,
             FillSpacesByHandTaskTeacherReq)
create_alias(AssessmentTaskName.CLASSIFICATION, ClassificationTaskStudentReq, ClassificationTaskRes,
             ClassificationTaskTeacherReq)
create_alias(AssessmentTaskName.SENTENCE_OREDER, SentenceOrderTaskStudentReq, SentenceOrderTaskRes,
             SentenceOrderTaskTeacherReq)
create_alias(AssessmentTaskName.OPEN_QUESTION, OpenQuestionTaskStudentReq, OpenQuestionTaskRes,
             OpenQuestionTaskTeacherReq)
create_alias(AssessmentTaskName.IMG, ImgTaskStudentReq, ImgTaskRes, ImgTaskTeacherReq)

# Check Aliases
for name in AssessmentTaskName:
    if name.value not in Aliases.keys():
        raise KeyError(f"Alias {name} not found")


class AssessmentCreateReq(BaseModel):
    tasks: str
    description: str | None = None
    time_limit: datetime.time | None = None

    @validator("time_limit", always=True, pre=True)
    def options_validation(cls, v):
        if v is None:
            return None
        return datetime.datetime.strptime(v, '%H:%M:%S').time()
