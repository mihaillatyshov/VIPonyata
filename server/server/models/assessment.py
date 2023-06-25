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

    def create_new_dict(self) -> dict:
        return self.dict()

    def combine_dict(self) -> dict:
        return self.dict(exclude={})

    class Config:
        extra = "ignore"


#########################################################################################################################
################ Text ###################################################################################################
#########################################################################################################################
class TextTaskReq(BaseModelTask):
    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.TEXT)


class TextTaskRes(TextTaskReq, BaseModelRes):
    text: str

    def custom_validation(self) -> bool:
        return True


class TextTaskReqCreate(TextTaskRes):
    pass


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


class SingleTestTaskReq(SingleTestTaskBase):
    answer: int | None                                                                                                  #or (self.answer > 0 and self.answer < len(self.opt))


class SingleTestTaskRes(SingleTestTaskFullBase, BaseModelRes):
    answer: int | None

    def create_new_dict(self) -> dict:
        result = self.dict()
        result["answer"] = None
        return result

    def custom_validation(self) -> bool:
        return self.answer is None or (0 <= self.answer < len(self.options))


class SingleTestTaskReqCreate(SingleTestTaskFullBase):
    answer: int

    @validator("options", always=True)
    def options_validation(cls, v: list[str]):
        if len(v) <= 1:
            raise ValueError(f"Мало вариантов выбора ({len(v)})")
        return v


#########################################################################################################################
################ MultiTest ##############################################################################################
#########################################################################################################################
class MultiTestTaskBase(BaseModelTask):
    answers: list[int]

    @validator("name", always=True)
    def name_validation(cls, v):
        return validate_name(v, AssessmentTaskName.TEST_MULTI)


class MultiTestTaskFullBase(MultiTestTaskBase):
    question: str
    options: list[str]


class MultiTestTaskReq(MultiTestTaskBase):
    pass


class MultiTestTaskRes(MultiTestTaskFullBase, BaseModelRes):
    def create_new_dict(self) -> dict:
        result = self.dict()
        result["answers"] = []
        return result

    def custom_validation(self) -> bool:
        if len(self.answers) != len(set(self.answers)):
            return False

        for answer in self.answers:
            if 0 <= answer < len(self.options):
                return False

        return True


class MultiTestTaskReqCreate(MultiTestTaskFullBase):
    @validator("answers", always=True)
    def answers_validation(cls, v):
        if len(v) < 1:
            raise ValueError(f"Мало вариантов ответа ({len(v)})")
        return v

    @validator("options", always=True)
    def options_validation(cls, v):
        if len(v) <= 1:
            raise ValueError(f"Мало вариантов выбора ({len(v)})")
        return v


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
    @root_validator()
    def first_second_validate(cls, values: dict):
        print("values", values)
        first: list[str] = values["first"]
        second: list[str] = values["second"]

        if ((len(first) != len(set(first))) or (len(second) != len(set(second)))):
            raise ValueError("Есть повторения полей")

        if (len(first) != len(second)):
            raise ValueError("Первый и второй стоблец разной длины")

        return values


class FindPairTaskReq(FindPairTaskReqBase):
    pass


class FindPairTaskRes(FindPairTaskBase, BaseModelRes):
    to_check_first: list[str] = []
    to_check_second: list[str] = []

    @root_validator()
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

        return True


class FindPairTaskReqCreate(FindPairTaskReqBase):
    pass


fp = FindPairTaskReq(name=AssessmentTaskName.FIND_PAIR, first=["f1", "f2"], second=["s1", "s2"])
print(fp.dict())

fp2 = FindPairTaskRes(name=AssessmentTaskName.FIND_PAIR, first=["f2", "f1"], second=["s2", "s1"])
print("CD", fp2.combine_dict())
print(fp2)
print(fp2.dict())

fp3 = FindPairTaskRes(**(fp2.combine_dict() | fp.combine_dict()))
print(fp3)
print(fp3.dict())

exit()


#########################################################################################################################
################ Alias ##################################################################################################
#########################################################################################################################
class AliasName(Enum):
    REQ = "req"
    RES = "res"
    CREATE = "create"


Aliases: dict[AssessmentTaskName, dict] = {}


def create_alias(name: AssessmentTaskName, req, res, create):
    Aliases[name] = {AliasName.REQ: req, AliasName.RES: res, AliasName.CREATE: create}


create_alias(AssessmentTaskName.TEXT, TextTaskReq, TextTaskRes, TextTaskReqCreate)
create_alias(AssessmentTaskName.TEST_SINGLE, SingleTestTaskReq, SingleTestTaskRes, SingleTestTaskReqCreate)
create_alias(AssessmentTaskName.TEST_MULTI, MultiTestTaskReq, MultiTestTaskRes, MultiTestTaskReqCreate)

#Check Aliases
for name in AssessmentTaskName:
    if name not in Aliases.keys():
        raise KeyError(f"Alias {name} not found")
