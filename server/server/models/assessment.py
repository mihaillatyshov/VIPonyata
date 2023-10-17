import abc
import datetime
import random
import re
from enum import Enum
from typing import TypedDict

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from server.models.utils import StrExtraSpaceRemove


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
    AUDIO = "audio"


ANSWER_CANT_BE_EMPTY = "Ответ не может быть пустым"
QESTION_CANT_BE_EMPTY = "Вопрос не может быть пустым"


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
        for key in self.model_dump().keys():
            if not key.startswith("meta_"):
                data[key] = self.model_dump()[key]
        return data

    def student_new_dict(self) -> dict:
        return self.student_dict()

    def teacher_dict(self) -> dict:
        return self.model_dump()

    def combine_dict(self) -> dict:
        return self.model_dump()

    model_config = ConfigDict(extra="ignore")


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
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.TEXT)


class TextTaskTeacherBase(TextTaskBase):
    text: StrExtraSpaceRemove


class TextTaskStudentReq(TextTaskBase):
    pass


class TextTaskRes(TextTaskTeacherBase, BaseModelRes):
    def custom_validation(self) -> bool:
        return True


class TextTaskTeacherReq(TextTaskTeacherBase):
    @model_validator(mode="after")
    def validate_on_create(self) -> "TextTaskTeacherReq":
        if not self.text:
            raise ValueError("Текст не может быть пустым")

        return self


class TextTaskCheck(BaseModelCheck):
    pass


#########################################################################################################################
################ SingleTest #############################################################################################
#########################################################################################################################
class SingleTestTaskBase(BaseModelTask):
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.TEST_SINGLE)


class SingleTestTaskTeacherBase(SingleTestTaskBase):
    question: StrExtraSpaceRemove
    options: list[StrExtraSpaceRemove]
    meta_answer: int


class SingleTestTaskStudentReq(SingleTestTaskBase):
    answer: int | None = None  # or (self.answer > 0 and self.answer < len(self.opt))


class SingleTestTaskRes(SingleTestTaskTeacherBase, BaseModelRes):
    answer: int | None = None

    def custom_validation(self) -> bool:
        return self.answer is None or (0 <= self.answer < len(self.options))


class SingleTestTaskTeacherReq(SingleTestTaskTeacherBase):
    @field_validator("options")
    @classmethod
    def options_validation(cls, v: list[StrExtraSpaceRemove]):
        if len(v) <= 1:
            raise ValueError(f"Мало вариантов выбора ({len(v)})")
        return v

    @model_validator(mode="after")
    def validate_on_create(self) -> "SingleTestTaskTeacherReq":
        if not (0 <= self.meta_answer < len(self.options)):
            raise ValueError(f"Выбран недопустимый вариант ответа ({self.meta_answer + 1})")

        if not self.question:
            raise ValueError(QESTION_CANT_BE_EMPTY)

        for option in self.options:
            if not option:
                raise ValueError(ANSWER_CANT_BE_EMPTY)

        return self


class SingleTestTaskCheck(BaseModelCheck):
    mistake_answer: None | int = None


#########################################################################################################################
################ MultiTest ##############################################################################################
#########################################################################################################################
class MultiTestTaskBase(BaseModelTask):
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.TEST_MULTI)


class MultiTestTaskTeacherBase(MultiTestTaskBase):
    question: StrExtraSpaceRemove
    options: list[StrExtraSpaceRemove]
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
    @field_validator("options")
    @classmethod
    def options_validation(cls, v: list[StrExtraSpaceRemove]):
        if len(v) <= 1:
            raise ValueError(f"Мало вариантов выбора ({len(v)})")
        return v

    @model_validator(mode="after")
    def validate_on_create(self) -> "MultiTestTaskTeacherReq":
        if len(self.meta_answers) < 1:
            raise ValueError(f"Мало вариантов ответа ({len(self.meta_answers)})")

        if len(self.meta_answers) != len(set(self.meta_answers)):
            raise ValueError(f"Варианты ответа повторяются ({self.meta_answers})")

        for answer in self.meta_answers:
            if not (0 <= answer < len(self.options)):
                raise ValueError(f"Варианты ответа вне диапазона ({self.meta_answers})")

        if not self.question:
            raise ValueError(QESTION_CANT_BE_EMPTY)

        for option in self.options:
            if not option:
                raise ValueError(ANSWER_CANT_BE_EMPTY)

        return self


class MultiTestTaskCheck(BaseModelCheck):
    mistake_answers: list[int] = []


#########################################################################################################################
################ FindPair ###############################################################################################
#########################################################################################################################
class FindPairTaskBase(BaseModelTask):
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.FIND_PAIR)


class FindPairTaskTeacherBase(FindPairTaskBase):
    meta_first: list[StrExtraSpaceRemove]
    meta_second: list[StrExtraSpaceRemove]


def find_pair_fs_validation_base(first: list[StrExtraSpaceRemove], second: list[StrExtraSpaceRemove]):
    if (len(first) != len(set(first))) or (len(second) != len(set(second))):
        raise ValueError("Есть повторения полей")

    if len(first) != len(second):
        raise ValueError(f"Первый и второй стоблец разной длины (f:{len(first)}, s:{len(second)})")

    if len(first) < 2:
        raise ValueError(f"Слишком мало полей ({len(first)})")


class FindPairTaskStudentReq(FindPairTaskBase):
    first: list[StrExtraSpaceRemove]
    second: list[StrExtraSpaceRemove]
    pars_created: int

    @model_validator(mode="after")
    def first_second_validation(self) -> "FindPairTaskStudentReq":
        find_pair_fs_validation_base(self.first, self.second)
        return self


class FindPairTaskRes(FindPairTaskTeacherBase, BaseModelRes):
    pars_created: int = 0
    first: list[StrExtraSpaceRemove] = []
    second: list[StrExtraSpaceRemove] = []

    @model_validator(mode="after")
    def new_first_second_validation(self) -> "FindPairTaskRes":
        if len(self.first) == 0:
            self.first = self.meta_first.copy()
            random.shuffle(self.first)

        if len(self.second) == 0:
            self.second = self.meta_second.copy()
            random.shuffle(self.second)

        return self

    def custom_validation(self) -> bool:
        if (len(set(self.meta_first)) != len(self.first)) or (len(set(self.meta_second)) != len(self.second)):
            return False

        if (set(self.meta_first) != set(self.first)) or (set(self.meta_second) != set(self.second)):
            return False

        return True


class FindPairTaskTeacherReq(FindPairTaskTeacherBase):
    @model_validator(mode="after")
    def validate_on_create(self) -> "FindPairTaskTeacherReq":
        find_pair_fs_validation_base(self.meta_first, self.meta_second)

        for first in self.meta_first:
            if not first:
                raise ValueError("Пустые поля в первой колонке")

        for second in self.meta_second:
            if not second:
                raise ValueError("Пустые поля во второй колонке")

        return self


class FindPairTaskCheck(BaseModelCheck):
    mistake_lines: list[int] = []


#########################################################################################################################
################ IOrder #################################################################################################
#########################################################################################################################
class IOrderTaskTeacherBase(BaseModelTask):
    meta_parts: list[StrExtraSpaceRemove]


class IOrderTaskStudentReq(BaseModelTask):
    parts: list[StrExtraSpaceRemove]

    @model_validator(mode="after")
    def parts_validation(self) -> "IOrderTaskStudentReq":
        create_sentence_parts_validation_base(self.parts)
        return self


class IOrderTaskRes(IOrderTaskTeacherBase, BaseModelRes):
    parts: list[StrExtraSpaceRemove] = []

    @model_validator(mode="after")
    def new_parts_validation(self) -> "IOrderTaskRes":
        if len(self.parts) == 0:
            self.parts = self.meta_parts.copy()
            random.shuffle(self.parts)
        return self

    def custom_validation(self) -> bool:
        if len(self.meta_parts) != len(self.parts):
            return False

        meta_parts = self.meta_parts.copy()
        meta_parts.sort()
        parts = self.parts.copy()
        parts.sort()

        return meta_parts == parts


class IOrderTaskTeacherReq(IOrderTaskTeacherBase):
    @model_validator(mode="after")
    def validate_on_create(self) -> "IOrderTaskTeacherReq":
        create_sentence_parts_validation_base(self.meta_parts)

        for part in self.meta_parts:
            if not part:
                raise ValueError("Поля не могут быть пустыми")

        return self


class IOrderTaskCheck(BaseModelCheck):
    mistake_parts: list[int] = []


#########################################################################################################################
################ CreateSentence #########################################################################################
#########################################################################################################################
class CreateSentenceTaskBase(BaseModelTask):
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
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
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
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
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.FILL_SPACES_EXISTS)


class FillSpacesExistsTaskTeacherBase(FillSpacesExistsTaskBase):
    separates: list[StrExtraSpaceRemove]
    meta_answers: list[StrExtraSpaceRemove]


class FillSpacesExistsTaskStudentReq(FillSpacesExistsTaskBase):
    answers: list[StrExtraSpaceRemove | None]
    inputs: list[StrExtraSpaceRemove]


class FillSpacesExistsTaskRes(FillSpacesExistsTaskTeacherBase, BaseModelRes):
    answers: list[StrExtraSpaceRemove | None] = []
    inputs: list[StrExtraSpaceRemove] = []

    @model_validator(mode="after")
    def new_inputs_validation(self) -> "FillSpacesExistsTaskRes":
        if len(self.answers) == 0:
            self.inputs = self.meta_answers.copy()
            random.shuffle(self.inputs)
            for _ in range(len(self.meta_answers)):
                self.answers.append(None)

        return self

    def custom_validation(self) -> bool:
        if len(self.answers) != len(self.meta_answers):
            return False

        combo_answers = [*list(filter(lambda item: item is not None, self.answers)), *self.inputs]
        combo_answers.sort()

        meta_answers = self.meta_answers.copy()
        meta_answers.sort()

        return combo_answers == meta_answers


class FillSpacesExistsTaskTeacherReq(FillSpacesExistsTaskTeacherBase):
    @model_validator(mode="after")
    def validate_on_create(self) -> "FillSpacesExistsTaskTeacherReq":
        if len(self.meta_answers) < 2:
            raise ValueError(f"Слишком мало полей ({len(self.meta_answers)})")

        for answer in self.meta_answers:
            if not answer:
                raise ValueError(ANSWER_CANT_BE_EMPTY)

        if (len(self.separates) - 1) != len(self.meta_answers):
            raise ValueError(
                f"Ответов должно быть на 1 меньше, чем разделителей (s:{len(self.separates)}, a:{len(self.meta_answers)})"
            )

        return self


class FillSpacesExistsTaskCheck(IFillSpacesTaskCheck):
    pass


#########################################################################################################################
################ FillSpacesByHand #######################################################################################
#########################################################################################################################
class FillSpacesByHandTaskBase(BaseModelTask):
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.FILL_SPACES_BY_HAND)


class FillSpacesByHandTaskTeacherBase(FillSpacesByHandTaskBase):
    separates: list[StrExtraSpaceRemove]
    meta_answers: list[StrExtraSpaceRemove]


class FillSpacesByHandTaskStudentReq(FillSpacesByHandTaskBase):
    answers: list[StrExtraSpaceRemove]

    @model_validator(mode="after")
    def answers_validation(self) -> "FillSpacesByHandTaskStudentReq":
        # TODO: Add check for answers count

        return self


class FillSpacesByHandTaskRes(FillSpacesByHandTaskTeacherBase, BaseModelRes):
    answers: list[StrExtraSpaceRemove] = []

    @model_validator(mode="after")
    def new_inputs_validation(self) -> "FillSpacesByHandTaskRes":
        if len(self.answers) == 0:
            for _ in range(len(self.meta_answers)):
                self.answers.append("")

        return self

    def custom_validation(self) -> bool:
        return len(self.answers) == len(self.meta_answers)


class FillSpacesByHandTaskTeacherReq(FillSpacesByHandTaskTeacherBase):
    @model_validator(mode="after")
    def validate_on_create(self) -> "FillSpacesByHandTaskTeacherReq":
        if len(self.meta_answers) < 1:
            raise ValueError(f"Слишком мало полей ({len(self.meta_answers)})")

        for answer in self.meta_answers:
            if not answer:
                raise ValueError(ANSWER_CANT_BE_EMPTY)

        if (len(self.separates) - 1) != len(self.meta_answers):
            raise ValueError(
                f"Ответов должно быть на 1 меньше, чем разделителей (s:{len(self.separates)}, a:{len(self.meta_answers)})"
            )

        return self


class FillSpacesByHandTaskCheck(IFillSpacesTaskCheck):
    pass


#########################################################################################################################
################ Classification #########################################################################################
#########################################################################################################################
class ClassificationTaskBase(BaseModelTask):
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.CLASSIFICATION)


class ClassificationTaskTeacherBase(ClassificationTaskBase):
    titles: list[StrExtraSpaceRemove]
    meta_answers: list[list[StrExtraSpaceRemove]]


class ClassificationTaskStudentReq(ClassificationTaskBase):
    answers: list[list[StrExtraSpaceRemove]]
    inputs: list[StrExtraSpaceRemove]


class ClassificationTaskRes(ClassificationTaskTeacherBase, BaseModelRes):
    answers: list[list[StrExtraSpaceRemove]] = []
    inputs: list[StrExtraSpaceRemove] = []

    @model_validator(mode="after")
    def new_inputs_validation(self) -> "ClassificationTaskRes":
        if len(self.answers) == 0:
            for col in self.meta_answers:
                self.answers.append([])
                self.inputs += col.copy()
            random.shuffle(self.inputs)

        return self

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
    @model_validator(mode="after")
    def validate_on_create(self) -> "ClassificationTaskTeacherReq":
        if len(self.meta_answers) < 1:
            raise ValueError(f"Слишком мало колонок ({len(self.meta_answers)})")

        if len(self.meta_answers) != len(self.titles):
            raise ValueError(
                f"Количество колонок ({len(self.meta_answers)}) не равно количеству названий ({len(self.titles)})")

        for col in self.meta_answers:
            if len(col) < 1:
                raise ValueError(f"Слишком мало значений в колонке ({len(col)})")

            for cell in col:
                if not cell:
                    raise ValueError("Поля не могут быть пустымы")

        for title in self.titles:
            if not title:
                raise ValueError("Название не может быть пустым")

        return self


class ClassificationTaskCheck(BaseModelCheck):
    mistake_answers: list[list[int]] = []


#########################################################################################################################
################ OpenQuestion ###########################################################################################
#########################################################################################################################
class OpenQuestionTaskBase(BaseModelTask):
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.OPEN_QUESTION)


class OpenQuestionTaskTeacherBase(OpenQuestionTaskBase):
    question: StrExtraSpaceRemove


class OpenQuestionTaskStudentReq(OpenQuestionTaskBase):
    answer: StrExtraSpaceRemove

    @model_validator(mode="after")
    def answers_validation(self) -> "OpenQuestionTaskStudentReq":

        return self


class OpenQuestionTaskRes(OpenQuestionTaskTeacherBase, BaseModelRes):
    answer: StrExtraSpaceRemove = ""

    def custom_validation(self) -> bool:
        return True


class OpenQuestionTaskTeacherReq(OpenQuestionTaskTeacherBase):
    @model_validator(mode="after")
    def validate_on_create(self) -> "OpenQuestionTaskTeacherReq":
        if not self.question:
            raise ValueError(QESTION_CANT_BE_EMPTY)

        return self


class OpenQuestionTaskCheck(BaseModelCheck):
    pass


#########################################################################################################################
################ Img ####################################################################################################
#########################################################################################################################
class ImgTaskBase(BaseModelTask):
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.IMG)


class ImgTaskTeacherBase(ImgTaskBase):
    url: str


class ImgTaskStudentReq(ImgTaskBase):
    pass


class ImgTaskRes(ImgTaskTeacherBase, BaseModelRes):
    def custom_validation(self) -> bool:
        return True


class ImgTaskTeacherReq(ImgTaskTeacherBase):
    @model_validator(mode="after")
    def validate_on_create(self) -> "ImgTaskTeacherReq":
        if not self.url:
            raise ValueError("Картинка не добавлена")

        return self


class ImgTaskCheck(BaseModelCheck):
    pass


#########################################################################################################################
################ Audio ##################################################################################################
#########################################################################################################################
class AudioTaskBase(BaseModelTask):
    @field_validator("name")
    @classmethod
    def name_validation(cls, v: str):
        return validate_name(v, AssessmentTaskName.AUDIO)


class AudioTaskTeacherBase(AudioTaskBase):
    url: str


class AudioTaskStudentReq(AudioTaskBase):
    pass


class AudioTaskRes(AudioTaskTeacherBase, BaseModelRes):
    def custom_validation(self) -> bool:
        return True


class AudioTaskTeacherReq(AudioTaskTeacherBase):
    @model_validator(mode="after")
    def validate_on_create(self) -> "AudioTaskTeacherReq":
        if not self.url:
            raise ValueError("Аудио не добавлена")

        return self


class AudioTaskCheck(BaseModelCheck):
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
create_alias(AssessmentTaskName.AUDIO, AudioTaskStudentReq, AudioTaskRes, AudioTaskTeacherReq)

# Check Aliases
for name in AssessmentTaskName:
    if name.value not in Aliases.keys():
        raise KeyError(f"Alias {name} not found")


#########################################################################################################################
################ Requests ###############################################################################################
#########################################################################################################################
class BaseModelTaskReq(BaseModel):
    name: AssessmentTaskName

    model_config = ConfigDict(extra="allow")


class AssessmentCreateReqStr(BaseModel):
    tasks: str
    description: StrExtraSpaceRemove | None = None
    time_limit: datetime.time | None = None

    @field_validator("time_limit", mode="before")
    @classmethod
    def options_validation(cls, v):
        if v is None:
            return None
        return datetime.datetime.strptime(v, '%H:%M:%S').time()


class AssessmentCreateReq(BaseModel):
    tasks: list[BaseModelTaskReq]
    description: StrExtraSpaceRemove | None = None
    time_limit: datetime.time | None = None

    @model_validator(mode="after")
    def tasks_validation(self) -> "AssessmentCreateReq":
        if len(self.tasks) == 0:
            raise ValueError("Нет заданий")

        return self
