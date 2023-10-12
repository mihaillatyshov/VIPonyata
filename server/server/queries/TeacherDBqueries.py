from typing import Generic, Type
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.log_lib import LogI
from server.models.assessment import AssessmentCreateReq
from server.models.course import CourseCreateReq
from server.models.db_models import (Assessment, AssessmentTry, Course, Dictionary, Drilling, DrillingCard, DrillingTry,
                                     Hieroglyph, HieroglyphCard, HieroglyphTry, Lesson, LexisCardType, LexisTryType,
                                     LexisType, NotificationStudentToTeacher)
from server.models.lesson import LessonCreateReq
from server.common import DBsession
from server.models.dictionary import DictionaryCreateReq, DictionaryCreateReqItem
from server.models.lexis import LexisCardCreateReq, LexisCreateReq


#########################################################################################################################
################ Course and Lesson ######################################################################################
#########################################################################################################################
def get_all_courses() -> list[Course]:
    return DBsession.query(Course).order_by(Course.sort).all()


def get_course_by_id(course_id: int) -> Course | None:
    return DBsession.query(Course).filter(Course.id == course_id).one_or_none()


def create_course(course_data: CourseCreateReq) -> Course:
    course = Course(**course_data.model_dump())
    DBsession.add(course)
    DBsession.commit()

    LogI(course)
    return course


def get_lessons_by_course_id(course_id: int) -> list[Lesson]:
    return DBsession.query(Lesson).filter(Lesson.course_id == course_id).all()


def GetLessonById(lessonId: int) -> Lesson | None:
    return DBsession.query(Lesson).filter(Lesson.id == lessonId).one_or_none()


def create_lesson(course_id: int, lesson_data: LessonCreateReq) -> Lesson:
    lesson = Lesson(course_id=course_id, **lesson_data.model_dump())
    DBsession.add(lesson)
    DBsession.commit()

    return lesson


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################
class LexisQueries(Generic[LexisType, LexisTryType, LexisCardType]):
    lexis_type: Type[LexisType]
    lexis_try_type: Type[LexisTryType]
    lexis_card_type: Type[LexisCardType]

    def __init__(self, lexis_type: Type[LexisType],
                 lexis_try_type: Type[LexisTryType],
                 lexis_card_type: Type[LexisCardType]):
        self.lexis_type = lexis_type
        self.lexis_try_type = lexis_try_type
        self.lexis_card_type = lexis_card_type

    def GetByLessonId(self, lessondId: int) -> LexisType | None:
        return DBsession.query(self.lexis_type).filter(self.lexis_type.lesson_id == lessondId).one_or_none()

    def GetById(self, lexisId: int) -> LexisType | None:
        return DBsession.query(self.lexis_type).filter(self.lexis_type.id == lexisId).one_or_none()

    def create_cards(self, lexis_id: int, cards_data: LexisCardCreateReq):
        cards: list[LexisCardType] = []
        for item in cards_data.cards:
            cards.append(self.lexis_card_type(base_id=lexis_id, **item.model_dump()))

        DBsession.add_all(cards)
        DBsession.commit()

    def create(self, lesson_id: int, lexis_data: LexisCreateReq) -> LexisType:
        lexis = self.lexis_type(lesson_id=lesson_id, **lexis_data.model_dump())
        DBsession.add(lexis)
        DBsession.commit()

        return lexis


DrillingQueries = LexisQueries(Drilling, DrillingTry, DrillingCard)
HieroglyphQueries = LexisQueries(Hieroglyph, HieroglyphTry, HieroglyphCard)


class AssessmentQueriesClass:
    assessment_type: type[Assessment]
    assessment_try_type: type[AssessmentTry]

    def __init__(self, assessment_type: type[Assessment], assessment_try_type: type[AssessmentTry]):
        self.assessment_type = assessment_type
        self.assessment_try_type = assessment_try_type

    def get_by_lesson_id(self, lesson_id: int) -> Assessment | None:
        return DBsession.query(self.assessment_type).filter(self.assessment_type.lesson_id == lesson_id).one_or_none()

    def create(self, lesson_id: int, assessment_data: AssessmentCreateReq):
        assessment = self.assessment_type(lesson_id=lesson_id, **assessment_data.model_dump())
        DBsession.add(assessment)
        DBsession.commit()

        return assessment


AssesmentQueries = AssessmentQueriesClass(Assessment, AssessmentTry)


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def get_dictionary() -> list[Dictionary]:
    return DBsession.query(Dictionary).all()


def get_dictionary_item(item: DictionaryCreateReqItem) -> Dictionary | None:
    base_filter = DBsession.query(Dictionary).filter(Dictionary.ru == item.ru)
    filter_char_jp = base_filter.filter(Dictionary.char_jp == item.char_jp)
    filter_word_jp = base_filter.filter(Dictionary.word_jp == item.word_jp)
    filter_full_jp = filter_char_jp.filter(Dictionary.word_jp == item.word_jp)

    if item.word_jp is not None and item.char_jp is not None:
        if res := filter_full_jp.one_or_none():
            return res
    if item.char_jp is not None:
        if res := filter_char_jp.one_or_none():
            return res
    if item.word_jp is not None:
        if res := filter_word_jp.one_or_none():
            return res

    return base_filter.one_or_none()


def create_or_get_dictionary(dictionary_data: DictionaryCreateReq) -> list[Dictionary]:
    result: list[Dictionary] = []

    for item in dictionary_data.items:
        dictionary_item = get_dictionary_item(item)
        if dictionary_item is None:
            dictionary_item = Dictionary(**item.model_dump())
            DBsession.add(dictionary_item)
            DBsession.commit()
        need_commit = False
        if (dictionary_item.char_jp is None and item.char_jp is not None):
            dictionary_item.char_jp = item.char_jp
            need_commit = True
        if (dictionary_item.word_jp is None and item.word_jp is not None):
            dictionary_item.word_jp = item.word_jp
            need_commit = True
        if need_commit:
            DBsession.commit()

        result.append(dictionary_item)

    return result


def add_img_to_dictionary(id: int, url: str):
    dictionary_item: Dictionary = DBsession.query(Dictionary).filter(Dictionary.id == id).one_or_none()

    if dictionary_item is None:
        raise InvalidAPIUsage(f"Can't find dict item with id {id}", 404)

    dictionary_item.img = url
    DBsession.commit()


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
def get_notifications():
    return (                                                                                                            #
        DBsession                                                                                                       #
        .query(NotificationStudentToTeacher)                                                                            #
        .filter(NotificationStudentToTeacher.deleted == False)                                                          #
        .order_by(NotificationStudentToTeacher.creation_datetime.desc())                                                #
        .all()                                                                                                          #
    )
