import abc
import random
from enum import Enum
from typing import TypedDict

from pydantic import BaseModel, root_validator, validator


class AssessmentTaskName(Enum):
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


def validate_name(input_name: str, task_name: AssessmentTaskName):
    if input_name != task_name:
        raise ValueError(f"Input name : {input_name} not eq to task name: {task_name}")
    return input_name


def create_sentence_parts_validation_base(parts: list[str]):
    if len(parts) < 2:
        raise ValueError(f"Слишком мало полей ({len(parts)})")


class BaseModelRes(abc.ABC):
    @abc.abstractmethod
    def custom_validation(self) -> bool:
        pass


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
    def meta_answer_validation(cls, values: dict):
        meta_answer = values["meta_answer"]
        if not (0 <= meta_answer < len(values["options"])):
            raise ValueError(f"Выбран недопустимый вариант ответа ({meta_answer + 1})")


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
    def meta_answer_validation(cls, values: dict):
        meta_answers = values["meta_answers"]

        if len(meta_answers) < 1:
            raise ValueError(f"Мало вариантов ответа ({len(meta_answers)})")

        if len(meta_answers) != len(set(meta_answers)):
            raise ValueError(f"Варианты ответа повторяются ({meta_answers})")

        for answer in meta_answers:
            if not (0 <= answer < len(values["options"])):
                raise ValueError(f"Варианты ответа вне диапазона ({meta_answers})")

        return values


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
            values["first"] = values["meta_first"]
            random.shuffle(values["first"])

        if len(values["second"]) == 0:
            values["second"] = values["meta_second"]
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
    def meta_first_second_validation(cls, values: dict):
        find_pair_fs_validation_base(values["meta_first"], values["meta_second"])
        return values


#########################################################################################################################
################ CreateSentence #########################################################################################
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
            values["parts"] = values["meta_parts"]
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
    def meta_parts_validation(cls, values: dict):
        create_sentence_parts_validation_base(values["meta_parts"])
        return values


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
    def answers_validate(cls, values: dict):
        if len(values["meta_answers"]) < 2:
            raise ValueError(f"Слишком мало полей ({len(values['meta_answers'])})")

        if (len(values["separates"]) - 1) != len(values["meta_answers"]):
            raise ValueError(
                f"Ответов должно быть на 1 меньше, чем разделителей (s:{len(values['separates'])}, a:{len(values['meta_answers'])})"
            )

        return values


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
    def answers_validate(cls, values: dict):
        if len(values["meta_answers"]) < 1:
            raise ValueError(f"Слишком мало полей ({len(values['meta_answers'])})")

        if (len(values["separates"]) - 1) != len(values["meta_answers"]):
            raise ValueError(
                f"Ответов должно быть на 1 меньше, чем разделителей (s:{len(values['separates'])}, a:{len(values['meta_answers'])})"
            )

        return values


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


class ClassificationTaskRes(ClassificationTaskTeacherBase, BaseModelRes):
    answers: list[list[str]] = []
    inputs: list[str] = []

    @root_validator(skip_on_failure=True)
    def new_inputs_validation(cls, values: dict):
        if len(values["answers"]) == 0:
            for col in values["meta_answers"]:
                values["answers"].append([])
                values["inputs"] += col
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
    def answers_validate(cls, values: dict):
        if len(values["meta_answers"]) < 1:
            raise ValueError(f"Слишком мало колонок ({len(values['meta_answers'])})")

        if len(values["meta_answers"]) != len(values["titles"]):
            raise ValueError(
                f"Количество колонок ({len(values['meta_answers'])}) не равно количеству названий ({len(values['titles'])})"
            )

        for col in values["meta_answers"]:
            if len(values["meta_answers"]) < 1:
                raise ValueError(f"Слишком мало значений в колонке ({len(col)})")

        return values


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


class OpenQuestionTaskRes(OpenQuestionTaskTeacherBase, BaseModelRes):
    answer: str = ""

    def custom_validation(self) -> bool:
        return True


class OpenQuestionTaskTeacherReq(OpenQuestionTaskTeacherBase):
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
    pass


# fp = FindPairTaskReq(name=AssessmentTaskName.FIND_PAIR, first=["f1", "f2"], second=["s1", "s2"])
# print(fp.dict())

# fp2 = FindPairTaskRes(name=AssessmentTaskName.FIND_PAIR, first=["f2", "f1"], second=["s2", "s1"])
# print("CD", fp2.combine_dict())
# print(fp2)
# print(fp2.dict())

# fp3 = FindPairTaskRes(**(fp2.combine_dict() | fp.combine_dict()))
# print(fp3)
# print(fp3.dict())

# exit()


#########################################################################################################################
################ Alias ##################################################################################################
#########################################################################################################################
class AliasType(TypedDict):
    req: type[BaseModelTask]
    res: type[BaseModelTask]
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
