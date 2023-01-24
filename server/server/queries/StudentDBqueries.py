from datetime import datetime

from ..ApiExceptions import InvalidAPIUsage, CourseNotFoundException, LessonNotFoundException, LexisNotFoundException
from ..db_models import (User, Course, Lesson, Drilling, DrillingTry, Hieroglyph, HieroglyphTry, LexisType,
                         LexisTryType)
from ..log_lib import LogI
from .DBqueriesUtils import DBsession


#########################################################################################################################
################ Course and Lesson ######################################################################################
#########################################################################################################################
def GetAvailableCourses(userId: int) -> list[Course]:
    return DBsession.query(Course).join(Course.users).filter(User.id == userId).order_by(Course.sort).all()


def GetCourseById(courseId: int, userId: int) -> Course:
    course = (                                                                                                          #
        DBsession                                                                                                       #
        .query(Course)                                                                                                  #
        .filter(Course.id == courseId)                                                                                  #
        .join(Course.users)                                                                                             #
        .filter(User.id == userId)                                                                                      #
        .one_or_none()                                                                                                  #
    )                                                                                                                   #

    if course:
        return course

    if DBsession.query(Course).filter(Course.id == courseId).one_or_none():
        raise InvalidAPIUsage("You do not have access to this course!", 403)

    raise CourseNotFoundException()


def GetLessonsByCourseId(courseId: int, userId: int) -> list[Lesson]:
    return (                                                                                                            #
        DBsession                                                                                                       #
        .query(Lesson)                                                                                                  #
        .filter(Lesson.course_id == courseId)                                                                           #
        .join(Lesson.users)                                                                                             #
        .filter(User.id == userId)                                                                                      #
        .order_by(Lesson.number)                                                                                        #
        .all()                                                                                                          #
    )                                                                                                                   #


def GetLessonById(lessonId: int, userId: int) -> Lesson:
    lesson = (                                                                                                          #
        DBsession                                                                                                       #
        .query(Lesson)                                                                                                  #
        .filter(Lesson.id == lessonId)                                                                                  #
        .join(Lesson.users)                                                                                             #
        .filter(User.id == userId)                                                                                      #
        .one_or_none()                                                                                                  #
    )                                                                                                                   #

    if lesson:
        return lesson

    if lesson := DBsession.query(Lesson).filter(Lesson.id == lessonId).one_or_none():
        raise InvalidAPIUsage("You do not have access to this lesson!", 403, {"course_id": lesson.course_id})

    raise LessonNotFoundException()


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################
class LexisQueries:
    lexis_type: LexisType
    lexisTry_type: LexisTryType

    def __init__(self, lexis_type: LexisType, lexisTry_type: LexisTryType):
        self.lexis_type = lexis_type
        self.lexisTry_type = lexisTry_type

    def GetLexisByLessonId(self, lessonId: int, userId: int) -> LexisType | None:
        return (                                                                                                        #
            DBsession                                                                                                   #
            .query(self.lexis_type)                                                                                     #
            .join(self.lexis_type.lesson)                                                                               #
            .filter(Lesson.id == lessonId)                                                                              #
            .join(Lesson.users)                                                                                         #
            .filter(User.id == userId)                                                                                  #
            .one_or_none()                                                                                              #
        )                                                                                                               #

    def GetLexisById(self, lexisId: int, userId: int) -> LexisType:
        lexis = (                                                                                                       #
            DBsession                                                                                                   #
            .query(self.lexis_type)                                                                                     #
            .filter(self.lexis_type.id == lexisId)                                                                      #
            .join(self.lexis_type.lesson)                                                                               #
            .join(Lesson.users)                                                                                         #
            .filter(User.id == userId)                                                                                  #
            .one_or_none()                                                                                              #
        )                                                                                                               #

        if lexis:
            return lexis

        if lexis := DBsession.query(self.lexis_type).filter(self.lexis_type.id == lexisId).one_or_none():
            raise InvalidAPIUsage(f"You do not have access to this {self.lexis_type.__name__}!", 403,
                                  {"lesson_id": lexis.lesson_id})

        raise LexisNotFoundException(self.lexis_type.__name__)

    def GetLexisTriesByLexisId(self, lexisId: int, userId: int) -> list[LexisTryType]:
        return (                                                                                                        #
            DBsession                                                                                                   #
            .query(self.lexisTry_type)                                                                                  #
            .join(self.lexisTry_type.base)                                                                              #
            .filter(self.lexis_type.id == lexisId)                                                                      #
            .join(self.lexis_type.lesson)                                                                               #
            .join(Lesson.users)                                                                                         #
            .filter(User.id == userId)                                                                                  #
            .order_by(self.lexisTry_type.try_number)                                                                    #
            .all()                                                                                                      #
        )

    def AddNewLexisTry(self, tryNumber: int, lexisId: int, userId: int) -> LexisTryType | None:
        LogI(f"AddNewLexisTry {self.lexisTry_type.__name__}:", tryNumber, lexisId, userId)
        newLexisTry = self.lexisTry_type(try_number=tryNumber,
                                         start_datetime=datetime.now(),
                                         user_id=userId,
                                         base_id=lexisId)
        DBsession.add(newLexisTry)
        DBsession.commit()
        return newLexisTry

    def GetUnfinishedLexisTryByLexisId(self, lexisId: int, userId: int) -> LexisTryType:
        lexisTry = (                                                                                                    #
            DBsession                                                                                                   #
            .query(self.lexisTry_type)                                                                                  #
            .filter(self.lexisTry_type.end_datetime == None)                                                            #
            .join(self.lexisTry_type.base)                                                                              #
            .filter(self.lexis_type.id == lexisId)                                                                      #
            .join(self.lexis_type.lesson)                                                                               #
            .join(Lesson.users)                                                                                         #
            .filter(User.id == userId)                                                                                  #
            .one_or_none()                                                                                              #
        )

        if lexisTry:
            return lexisTry

        if lexis := DBsession.query(self.lexis_type).filter(self.lexis_type.id == lexisId).one_or_none():
            raise InvalidAPIUsage(f"{self.lexis_type.__name__} not started!", 403, {"lesson_id": lexis.lesson_id})

        raise LexisNotFoundException(self.lexis_type.__name__)

    def SetDoneTasksInLexisTry(self, lexisTryId: int, doneTasks: str) -> None:
        lexisTry = DBsession.query(self.lexisTry_type).filter(self.lexisTry_type.id == lexisTryId).one_or_none()
        if lexisTry:
            lexisTry.done_tasks = doneTasks
            DBsession.add(lexisTry)
            DBsession.commit()


DrillingQueries = LexisQueries(Drilling, DrillingTry)
HieroglyphQueries = LexisQueries(Hieroglyph, HieroglyphTry)
