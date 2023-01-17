from datetime import datetime

from ..ApiExceptions import InvalidAPIUsage, CourseNotFoundException, LessonNotFoundException, DrillingNotFoundException
from ..DBlib import (Course, Dictionary, DoneDrilling, Drilling, DrillingCard, Lesson, User)
from ..log_lib import LogI
from .DBqueriesUtils import DBsession


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


def GetDrillingByLessonId(lessonId: int, userId: int) -> Drilling:
    return (                                                                                                            #
        DBsession                                                                                                       #
        .query(Drilling)                                                                                                #
        .join(Drilling.lesson)                                                                                          #
        .filter(Lesson.id == lessonId)                                                                                  #
        .join(Lesson.users)                                                                                             #
        .filter(User.id == userId)                                                                                      #
        .one_or_none()                                                                                                  #
    )                                                                                                                   #


def GetDrillingById(drillingId: int, userId: int) -> Drilling:
    drilling = (                                                                                                        #
        DBsession                                                                                                       #
        .query(Drilling)                                                                                                #
        .filter(Drilling.id == drillingId)                                                                              #
        .join(Drilling.lesson)                                                                                          #
        .join(Lesson.users)                                                                                             #
        .filter(User.id == userId)                                                                                      #
        .one_or_none()                                                                                                  #
    )                                                                                                                   #

    if drilling:
        return drilling

    if drilling := DBsession.query(Drilling).filter(Drilling.id == drillingId).one_or_none():
        raise InvalidAPIUsage("You do not have access to this drilling!", 403, {"lesson_id": drilling.lesson_id})

    raise DrillingNotFoundException()


def GetDoneDrillingsByDrillingId(drillingId: int, userId: int) -> list[DoneDrilling]:
    return (                                                                                                            #
        DBsession                                                                                                       #
        .query(DoneDrilling)                                                                                            #
        .join(DoneDrilling.drilling)                                                                                    #
        .filter(Drilling.id == drillingId)                                                                              #
        .join(Drilling.lesson)                                                                                          #
        .join(Lesson.users)                                                                                             #
        .filter(User.id == userId)                                                                                      #
        .order_by(DoneDrilling.try_number)                                                                              #
        .all()                                                                                                          #
    )


def AddNewDoneDrilling(tryNumber: int, drillingId: int, userId: int) -> DoneDrilling | None:
    LogI("AddNewDoneDrilling:", tryNumber, drillingId, userId)
    newDoneDrilling = DoneDrilling(try_number=tryNumber,
                                    start_datetime=datetime.now(),
                                    user_id=userId,
                                    drilling_id=drillingId)
    DBsession.add(newDoneDrilling)
    DBsession.commit()
    return newDoneDrilling


def GetUnfinishedDoneDrillingsByDrillingId(drillingId: int, userId: int) -> DoneDrilling:
    doneDrilling = (                                                                                                    #
        DBsession                                                                                                       #
        .query(DoneDrilling)                                                                                            #
        .filter(DoneDrilling.end_datetime == None)                                                                      #
        .join(DoneDrilling.drilling)                                                                                    #
        .filter(Drilling.id == drillingId)                                                                              #
        .join(Drilling.lesson)                                                                                          #
        .join(Lesson.users)                                                                                             #
        .filter(User.id == userId)                                                                                      #
        .one_or_none()                                                                                                  #
    )

    if doneDrilling:
        return doneDrilling

    if drilling := DBsession.query(Drilling).filter(Drilling.id == drillingId).one_or_none():
        raise InvalidAPIUsage("Drilling not started!", 403, {"lesson_id": drilling.lesson_id})

    raise DrillingNotFoundException()


def SetDoneTaskInDoneDrilling(doneDrillingId: int, doneTasks: str) -> None:
    doneDrilling = DBsession.query(DoneDrilling).filter(DoneDrilling.id == doneDrillingId).one_or_none()
    if doneDrilling:
        doneDrilling.done_tasks = doneTasks
        DBsession.add(doneDrilling)
        DBsession.commit()


def GetDrillingCardsByDrillingId(drillingId: int) -> list[DrillingCard]:
    return DBsession.query(DrillingCard).join(DrillingCard.drilling).filter(Drilling.id == drillingId).all()


def GetDictionaryByDrillingCardId(drillingCardId: int) -> Dictionary | None:
    return (                                                                                                            #
        DBsession                                                                                                       #
        .query(Dictionary)                                                                                              #
        .join(Dictionary.drilling_card)                                                                                 #
        .filter(DrillingCard.id == drillingCardId)                                                                      #
        .one_or_none()                                                                                                  #
    )                                                                                                                   #


# def GetAssessmentByLessonId(lessonId: int, userId: int):
#    return GetSingleItem(DB.GetTableJson("assessment", where=f"LessonId = '{lessonId}'"))

# def GetHieroglyphByLessonId(lessonId: int, userId: int):
#    return GetSingleItem(DB.GetTableJson("hieroglyph", where=f"LessonId = '{lessonId}'"))
