import abc
import random

from .student_activity_funcs import ActivityFuncs


class AssessmentTaskName:
    TEXT = "card"
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


AssessmentTaskNameList = [
    value for name, value in vars(AssessmentTaskName).items()
    if not callable(getattr(AssessmentTaskName, name)) and not name.startswith("__")
]


class AssessmentParser(abc.ABC):
    def CanParse(self, task_json: dict) -> bool:
        return self.name() == task_json["name"]

    @abc.abstractmethod
    def name(self) -> str:
        pass

    @abc.abstractmethod
    def parse(self, task_json: dict) -> dict:
        pass


class TextParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.TEXT

    def parse(self, task_json: dict) -> dict:
        return task_json


class TestParser(AssessmentParser):
    def parse(self, task_json: dict) -> dict:
        del task_json["meta"]
        random.shuffle(task_json["answers"])
        return task_json


class SingleTestParser(TestParser):
    def name(self) -> str:
        return AssessmentTaskName.TEST_SINGLE


class MultiTestParser(TestParser):
    def name(self) -> str:
        return AssessmentTaskName.TEST_MULTI


class FindPairParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.FIND_PAIR

    def parse(self, task_json: dict) -> dict:
        task_json["parts"] = []
        task_json["parts"].extend(task_json["first"])
        task_json["parts"].extend(task_json["second"])
        random.shuffle(task_json["parts"])
        del task_json["first"]
        del task_json["second"]
        return task_json


class ClassificationParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.CLASSIFICATION

    def parse(self, task_json: dict) -> dict:
        task_json["titles"] = []
        task_json["data"] = []
        for column in task_json["columns"]:
            task_json["titles"].append(column["title"])
            task_json["data"].extend(column["data"])
        return task_json


class SentenceOrderParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.SENTENCE_OREDER

    def parse(self, task_json: dict) -> dict:
        random.shuffle(task_json["sentences"])
        return task_json


class OpenQuestionParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.OPEN_QUESTION

    def parse(self, task_json: dict) -> dict:
        return task_json


class ImgParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.IMG

    def parse(self, task_json: dict) -> dict:
        return task_json


class AssessmentFuncs(ActivityFuncs):
    pass
