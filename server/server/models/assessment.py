import abc
from enum import Enum

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


class TextTaskStudentReq(TextTaskBase):
    pass


class TextTaskRes(TextTaskBase, BaseModelRes):
    text: str

    def custom_validation(self) -> bool:
        return True


class TextTaskTeacherReq(TextTaskBase):
    text: str


#########################################################################################################################
################ SingleTest #############################################################################################
#########################################################################################################################
class SingleTestTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.TEST_SINGLE)


class SingleTestTaskFullBase(SingleTestTaskBase):
    question: str
    options: list[str]

    meta_answer: int


class SingleTestTaskStudentReq(SingleTestTaskBase):
    answer: int | None                                                                                                  #or (self.answer > 0 and self.answer < len(self.opt))


class SingleTestTaskRes(SingleTestTaskFullBase, BaseModelRes):
    answer: int | None = None

    def custom_validation(self) -> bool:
        return self.answer is None or (0 <= self.answer < len(self.options))


class SingleTestTaskTeacherReq(SingleTestTaskFullBase):
    @validator("options", always=True)
    def options_validation(cls, v: list[str]):
        if len(v) <= 1:
            raise ValueError(f"Мало вариантов выбора ({len(v)})")
        return v

    @root_validator(skip_on_failure=True)
    def meta_answer_validation(cls, values: dict):
        meta_answer = values["meta_answer"]
        if not (0 <= meta_answer < len(values["options"])):
            raise ValueError(f"Выбран неверный вариант ответа ({meta_answer + 1})")


#########################################################################################################################
################ MultiTest ##############################################################################################
#########################################################################################################################
class MultiTestTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.TEST_MULTI)


class MultiTestTaskFullBase(MultiTestTaskBase):
    meta_answers: list[int]

    question: str
    options: list[str]


class MultiTestTaskStudentReq(MultiTestTaskBase):
    answers: list[int]


class MultiTestTaskRes(MultiTestTaskFullBase, BaseModelRes):
    answers: list[int] = []

    def custom_validation(self) -> bool:
        if len(self.answers) != len(set(self.answers)):
            return False

        for answer in self.answers:
            if not (0 <= answer < len(self.options)):
                return False

        return True


class MultiTestTaskTeacherReq(MultiTestTaskFullBase):
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
    pars_created: int = 0
    first: list[str]
    second: list[str]

    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.FIND_PAIR)

    class Config:
        fields = {"to_check_first": {"exclude": True}, "to_check_second": {"exclude": True}}


class FindPairTaskReqBase(FindPairTaskBase):
    @root_validator(skip_on_failure=True)
    def first_second_validate(cls, values: dict):
        first: list[str] = values["first"]
        second: list[str] = values["second"]

        if ((len(first) != len(set(first))) or (len(second) != len(set(second)))):
            raise ValueError("Есть повторения полей")

        if (len(first) != len(second)):
            raise ValueError("Первый и второй стоблец разной длины")

        if (len(first) < 2):
            raise ValueError("Слишком мало полей")

        return values


class FindPairTaskReq(FindPairTaskReqBase):
    pass


class FindPairTaskRes(FindPairTaskBase, BaseModelRes):
    to_check_first: list[str] = []
    to_check_second: list[str] = []

    @root_validator(skip_on_failure=True)
    def to_check_first_second_validation(cls, values: dict):
        if len(values["to_check_first"]) == 0:
            values["to_check_first"] = values["first"]

        if len(values["to_check_second"]) == 0:
            values["to_check_second"] = values["second"]

        return values

    def combine_dict(self) -> dict:
        result = self.dict()
        result["to_check_first"] = self.to_check_first
        result["to_check_second"] = self.to_check_second
        return result

    def custom_validation(self) -> bool:
        if ((len(set(self.to_check_first)) != len(self.first)) or (len(set(self.to_check_second)) != len(self.second))):
            return False

        if ((set(self.to_check_first) != set(self.first)) or (set(self.to_check_second) != set(self.second))):
            return False

        return True


class FindPairTaskCreate(FindPairTaskReqBase):
    pass


#########################################################################################################################
################ CreateSentence #########################################################################################
#########################################################################################################################
class CreateSentenceTaskBase(BaseModelTask):
    parts: list[str]

    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.CREATE_SENTENCE)

    class Config:
        fields = {"to_check_parts": {"exclude": True}}


class CreateSentenceTaskReqBase(CreateSentenceTaskBase):
    @root_validator(skip_on_failure=True)
    def parts_validate(cls, values: dict):
        if (len(values["parts"]) < 2):
            raise ValueError("Слишком мало полей")
        return values


class CreateSentenceTaskReq(CreateSentenceTaskReqBase):
    pass


class CreateSentenceTaskRes(CreateSentenceTaskBase, BaseModelRes):
    to_check_parts: list[str] = []

    @root_validator(skip_on_failure=True)
    def to_check_parts_validation(cls, values: dict):
        if len(values["to_check_parts"]) == 0:
            values["to_check_parts"] = values["parts"]
        return values

    def combine_dict(self) -> dict:
        result = self.dict()
        result["to_check_parts"] = self.to_check_parts
        return result

    def custom_validation(self) -> bool:
        if (len(self.to_check_parts) != len(self.parts)):
            return False

        to_check_parts = self.to_check_parts.copy()
        to_check_parts.sort()
        parts = self.parts.copy()
        parts.sort()

        return to_check_parts == parts


class CreateSentenceTaskCreate(CreateSentenceTaskReqBase):
    pass


#########################################################################################################################
################ FillSpacesExists #######################################################################################
#########################################################################################################################
class FillSpacesExistsTaskBase(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.FILL_SPACES_EXISTS)

    class Config:
        fields = {"to_check_answers": {"exclude": True}}


class FillSpacesExistsTaskReq(FillSpacesExistsTaskBase):
    answers: list[str | None]
    inputs: list[str]


class FillSpacesExistsTaskRes(FillSpacesExistsTaskBase, BaseModelRes):
    answers: list[str | None]
    inputs: list[str]
    to_check_answers: list[str] = []

    @root_validator(skip_on_failure=True)
    def to_check_answers_validation(cls, values: dict):
        if len(values["to_check_answers"]) == 0:
            values["to_check_answers"] = values["answers"]
        return values

    def combine_dict(self) -> dict:
        result = self.dict()
        result["to_check_answers"] = self.to_check_answers
        return result

    def custom_validation(self) -> bool:
        combo_answers = [*list(filter(lambda item: item is not None, self.answers)), *self.inputs]
        combo_answers.sort()

        to_check_answers = self.to_check_answers.copy()
        to_check_answers.sort()

        return combo_answers == to_check_answers


class FillSpacesExistsTaskCreate(FillSpacesExistsTaskBase):
    separates: list[str]
    answers: list[str]

    @root_validator(skip_on_failure=True)
    def answers_validate(cls, values: dict):
        if (len(values["answers"]) < 2):
            raise ValueError("Слишком мало полей")
        return values


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
class AliasName(Enum):
    REQ = "req"
    RES = "res"
    CREATE = "create"


Aliases: dict[str, dict] = {}


def create_alias(name: AssessmentTaskName, req, res, create):
    Aliases[name.value] = {AliasName.REQ: req, AliasName.RES: res, AliasName.CREATE: create}


create_alias(AssessmentTaskName.TEXT, TextTaskStudentReq, TextTaskRes, TextTaskTeacherReq)
create_alias(AssessmentTaskName.TEST_SINGLE, SingleTestTaskStudentReq, SingleTestTaskRes, SingleTestTaskTeacherReq)
create_alias(AssessmentTaskName.TEST_MULTI, MultiTestTaskStudentReq, MultiTestTaskRes, MultiTestTaskTeacherReq)

#Check Aliases
# for name in AssessmentTaskName:
#     if name.value not in Aliases.keys():
#         raise KeyError(f"Alias {name} not found")
