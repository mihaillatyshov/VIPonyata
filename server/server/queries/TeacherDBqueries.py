from server.log_lib import LogI
from server.models.course import CourseCreateReq

from server.db_models import (Course, Drilling, DrillingTry, Hieroglyph, HieroglyphTry, Lesson, LexisTryType, LexisType)
from server.queries.DBqueriesUtils import *
from server.models.lesson import LessonCreateReq
from server.exceptions.ApiExceptions import InvalidAPIUsage


#########################################################################################################################
################ Course and Lesson ######################################################################################
#########################################################################################################################
def GetCourses() -> list[Course]:
    return DBsession().query(Course).order_by(Course.sort).all()


def GetCourseById(courseId: int) -> Course | None:
    return DBsession().query(Course).filter(Course.id == courseId).one_or_none()


def create_course(course_data: CourseCreateReq) -> Course:
    course = Course(**course_data.dict())
    DBsession.add(course)
    DBsession.commit()

    LogI(course)
    return course


def GetLessonsByCourseId(courseId: int) -> list[Lesson]:
    return DBsession().query(Lesson).filter(Lesson.course_id == courseId).all()


def GetLessonById(lessonId: int) -> Lesson:
    return DBsession().query(Lesson).filter(Lesson.id == lessonId).one_or_none()


def create_lesson(course_id: int, lesson_data: LessonCreateReq) -> Lesson:
    if GetCourseById(course_id):
        lesson = Lesson(course_id=course_id, **lesson_data.dict())
        DBsession.add(lesson)
        DBsession.commit()
        LogI(lesson)

        return lesson

    raise InvalidAPIUsage("No course in db!", 403)


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################
class LexisQueries:
    lexis_type: LexisType
    lexisTry_type: LexisTryType

    def __init__(self, lexis_type: LexisType, lexisTry_type: LexisTryType):
        self.lexis_type = lexis_type
        self.lexisTry_type = lexisTry_type

    def GetByLessonId(self, lessondId: int) -> LexisType:
        return DBsession().query(self.lexis_type).filter(self.lexis_type.lesson_id == lessondId).one_or_none()

    def GetById(self, lexisId: int) -> LexisType:
        return DBsession().query(self.lexis_type).filter(self.lexis_type.id == lexisId).one_or_none()


DrillingQueries = LexisQueries(Drilling, DrillingTry)
HieroglyphQueries = LexisQueries(Hieroglyph, HieroglyphTry)


def GetAssessmentByLessonId(lessondId: int) -> dict:
    return {}
    # return GetSingleItem(DB.GetTableJson("assessment", where=f"LessonId = '{lessondId}'"))