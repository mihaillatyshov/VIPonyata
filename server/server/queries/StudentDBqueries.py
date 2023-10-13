from datetime import datetime
from typing import Generic, TypeVar

from sqlalchemy import select, update

from server.common import DBsession
from server.exceptions.ApiExceptions import (ActivityNotFoundException, CourseNotFoundException, InvalidAPIUsage,
                                             LessonNotFoundException)
from server.log_lib import LogI
from server.models.db_models import (ActivityTryType, ActivityType, Assessment, AssessmentTry, AssessmentTryType,
                                     AssessmentType, Course, Dictionary, Drilling, DrillingTry, FinalBoss, FinalBossTry,
                                     Hieroglyph, HieroglyphTry, Lesson, LexisTryType, LexisType,
                                     NotificationStudentToTeacher, NotificationTeacherToStudent, User, UserDictionary)
from server.models.dictionary import DictionaryAssosiationReq, DictionaryImgReq


#########################################################################################################################
################ Course and Lesson ######################################################################################
#########################################################################################################################
def get_available_courses(user_id: int) -> list[Course]:
    with DBsession.begin() as session:
        return session.scalars(select(Course).join(Course.users).where(User.id == user_id).order_by(Course.sort)).all()


def get_course_by_id(course_id: int, user_id: int) -> Course:
    with DBsession.begin() as session:
        course = session.scalars(
            select(Course).where(Course.id == course_id).join(Course.users).where(User.id == user_id)).one_or_none()

        # TODO move code after to Upper Layer
        if course is not None:
            return course

        if session.scalars(select(Course).where(Course.id == course_id)).one_or_none():
            raise InvalidAPIUsage("You do not have access to this course!", 403)

        raise CourseNotFoundException()


def get_lessons_by_course_id(course_id: int, user_id: int) -> list[Lesson]:
    with DBsession.begin() as session:
        return session.scalars(
            select(Lesson).where(Lesson.course_id == course_id).join(Lesson.users).where(User.id == user_id).order_by(
                Lesson.number)).all()


def get_lesson_by_id(lesson_id: int, user_id: int) -> Lesson:
    with DBsession.begin() as session:
        lesson = session.scalars(
            select(Lesson).where(Lesson.id == lesson_id).join(Lesson.users).where(User.id == user_id)).one_or_none()

        # TODO move code after to Upper Layer
        if lesson:
            return lesson

        if lesson := session.scalars(select(Lesson).where(Lesson.id == lesson_id)).one_or_none():
            raise InvalidAPIUsage("You do not have access to this lesson!", 403, {"course_id": lesson.course_id})

        raise LessonNotFoundException()


#########################################################################################################################
################ Activity ###############################################################################################
#########################################################################################################################
class ActivityQueries(Generic[ActivityType, ActivityTryType]):
    _activity_type: type[ActivityType]
    _activityTry_type: type[ActivityTryType]

    def __init__(self, activity_type: type[ActivityType], activityTry_type: type[ActivityTryType]):
        self._activity_type = activity_type
        self._activityTry_type = activityTry_type

    def GetByLessonId(self, lessonId: int, userId: int) -> ActivityType | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_type).join(self._activity_type.lesson).where(Lesson.id == lessonId).join(
                    Lesson.users).where(User.id == userId)).one_or_none()

    def GetById(self, activityId: int, userId: int) -> ActivityType:
        with DBsession.begin() as session:
            activity = session.scalars(
                select(self._activity_type).where(self._activity_type.id == activityId).join(
                    self._activity_type.lesson).join(Lesson.users).where(User.id == userId)).one_or_none()

            # TODO move code after to Upper Layer
            if activity:
                return activity

            if activity := session.scalars(select(
                    self._activity_type).where(self._activity_type.id == activityId)).one_or_none():
                raise InvalidAPIUsage(f"You do not have access to this {self._activity_type.__name__}!", 403,
                                      {"lesson_id": activity.lesson_id})

            raise ActivityNotFoundException(self._activity_type.__name__)

    def GetTriesByActivityId(self, activityId: int, userId: int) -> list[ActivityTryType]:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activityTry_type).join(self._activityTry_type.base).where(
                    self._activity_type.id == activityId).join(self._activity_type.lesson).join(
                        Lesson.users).where(User.id == userId).order_by(self._activityTry_type.try_number)).all()

    def AddNewTry(self, tryNumber: int, activityId: int, userId: int) -> ActivityTryType | None:
        with DBsession.begin() as session:
            LogI(f"Add New Activity Try {self._activityTry_type.__name__}: ", tryNumber, activityId, userId)
            newActivityTry = self._activityTry_type(try_number=tryNumber,
                                                    start_datetime=datetime.now(),
                                                    user_id=userId,
                                                    base_id=activityId)
            session.add(newActivityTry)
            return newActivityTry

    def GetUnfinishedTryByActivityId(self, activityId: int, userId: int) -> ActivityTryType:
        with DBsession.begin() as session:
            activity_try = session.scalars(
                select(self._activityTry_type).where(self._activityTry_type.end_datetime == None).join(
                    self._activityTry_type.base).where(self._activity_type.id == activityId).join(
                        self._activity_type.lesson).join(Lesson.users).where(User.id == userId)).one_or_none()

            # TODO move code after to Upper Layer
            if activity_try:
                return activity_try

            if activity := session.scalars(select(
                    self._activity_type).where(self._activity_type.id == activityId)).one_or_none():
                raise InvalidAPIUsage(f"{self._activity_type.__name__} not started!", 403,
                                      {"lesson_id": activity.lesson_id})

            raise ActivityNotFoundException(self._activity_type.__name__)


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################


class LexisQueries(ActivityQueries[LexisType, LexisTryType]):
    _activity_type: type[LexisType]
    _activityTry_type: type[LexisTryType]

    def set_done_tasks_in_try(self, activity_try_id: int, done_tasks: str) -> None:
        with DBsession.begin() as session:
            session.execute(
                update(self._activityTry_type).where(self._activityTry_type.id == activity_try_id).values(
                    done_tasks=done_tasks))


#########################################################################################################################
################ Drilling and Hieroglyph ################################################################################
#########################################################################################################################
DrillingQueries = LexisQueries[Drilling, DrillingTry](Drilling, DrillingTry)
HieroglyphQueries = LexisQueries[Hieroglyph, HieroglyphTry](Hieroglyph, HieroglyphTry)


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
class AssessmentQueriesClass(ActivityQueries[AssessmentType, AssessmentTryType]):
    def add_assessment_new_try(self,
                               try_number: int,
                               activity_id: int,
                               user_id: int,
                               tasks: str = "",
                               checked_tasks: str = "") -> AssessmentTryType | None:
        new_activity_try = self._activityTry_type(try_number=try_number,
                                                  start_datetime=datetime.now(),
                                                  user_id=user_id,
                                                  done_tasks=tasks,
                                                  checked_tasks=checked_tasks,
                                                  base_id=activity_id)
        DBsession.add(new_activity_try)
        DBsession.commit()
        return new_activity_try

    # def add_done_and_check_tasks(self, activity_id: int)


AssessmentQueries = AssessmentQueriesClass[Assessment, AssessmentTry](Assessment, AssessmentTry)
FinalBossQueries = AssessmentQueriesClass[FinalBoss, FinalBossTry](FinalBoss, FinalBossTry)


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def add_user_dictionary_if_not_exists(user_id: int, dictionary_id: int) -> UserDictionary:
    dictinary = (DBsession.query(UserDictionary).filter(UserDictionary.dictionary_id == dictionary_id).filter(
        UserDictionary.user_id == user_id).one_or_none())

    if dictinary is None:
        dictinary = UserDictionary(user_id=user_id, dictionary_id=dictionary_id)
        DBsession.add(dictinary)
        DBsession.commit()

    return dictinary


def get_dictionary(user_id: int) -> list[Dictionary]:
    return (DBsession.query(Dictionary, UserDictionary).filter(Dictionary.id == UserDictionary.dictionary_id).filter(
        UserDictionary.user_id == user_id).all())


def add_img_to_dictionary(dictionary_img_req: DictionaryImgReq, user_id: int):
    dictionary_item = add_user_dictionary_if_not_exists(user_id, dictionary_img_req.dictionary_id)

    dictionary_item.img = dictionary_img_req.url
    DBsession.commit()


def add_assosiation_to_dictionary(dictionary_assosiation_req: DictionaryAssosiationReq, user_id: int):
    dictionary_item = add_user_dictionary_if_not_exists(user_id, dictionary_assosiation_req.dictionary_id)

    dictionary_item.img = dictionary_assosiation_req.assosiation
    DBsession.commit()


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
def get_notifications(user_id: int):
    return []
    return (                                                                                                            #
        DBsession                                                                                                       #
        .query(NotificationTeacherToStudent)                                                                            #
        .filter(NotificationTeacherToStudent.deleted == False)                                                          #
        .order_by(NotificationTeacherToStudent.creation_datetime)                                                       #
        .all()                                                                                                          #
    )


def add_final_boss_notification(final_boss_try_id: int):
    DBsession.add(NotificationStudentToTeacher(final_boss_try_id=final_boss_try_id))
    DBsession.commit()


def add_assessment_notification(assessment_try_id: int):
    DBsession.add(NotificationStudentToTeacher(assessment_try_id=assessment_try_id))
    DBsession.commit()


def add_drilling_notification(drilling_try_id: int):
    DBsession.add(NotificationStudentToTeacher(drilling_try_id=drilling_try_id))
    DBsession.commit()


def add_hieroglyph_notification(hieroglyph_try_id: int):
    DBsession.add(NotificationStudentToTeacher(hieroglyph_try_id=hieroglyph_try_id))
    DBsession.commit()
