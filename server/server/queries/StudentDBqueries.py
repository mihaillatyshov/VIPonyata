from datetime import datetime
from typing import Generic

from sqlalchemy import select, update

from server.common import DBsession
from server.exceptions.ApiExceptions import (ActivityNotFoundException,
                                             CourseNotFoundException,
                                             InvalidAPIUsage,
                                             LessonNotFoundException)
from server.log_lib import LogI
from server.models.db_models import (ActivityTryType, ActivityType, Assessment,
                                     AssessmentTry, AssessmentTryType,
                                     AssessmentType, Course, Dictionary,
                                     Drilling, DrillingCard, DrillingTry,
                                     FinalBoss, FinalBossTry, Hieroglyph,
                                     HieroglyphCard, HieroglyphTry, Lesson,
                                     LexisCardType, LexisTryType, LexisType,
                                     NotificationStudentToTeacher,
                                     NotificationTeacherToStudent, User,
                                     UserDictionary)
from server.models.dictionary import DictionaryAssociationReq, DictionaryImgReq


#########################################################################################################################
################ Course and Lesson ######################################################################################
#########################################################################################################################
def get_available_courses(user_id: int) -> list[Course]:
    with DBsession.begin() as session:
        return session.scalars(
            select(Course)
            .join(Course.users)
            .where(User.id == user_id)
            .order_by(Course.sort)
        ).all()


def get_course_by_id(course_id: int, user_id: int) -> Course:
    with DBsession.begin() as session:
        course = session.scalars(
            select(Course)
            .where(Course.id == course_id)
            .join(Course.users)
            .where(User.id == user_id)
        ).one_or_none()

        # TODO move code after to Upper Layer
        if course is not None:
            return course

        if session.scalars(select(Course).where(Course.id == course_id)).one_or_none():
            raise InvalidAPIUsage("You do not have access to this course!", 403)

        raise CourseNotFoundException(course_id)


def get_lessons_by_course_id(course_id: int, user_id: int) -> list[Lesson]:
    with DBsession.begin() as session:
        return session.scalars(
            select(Lesson)
            .where(Lesson.course_id == course_id)
            .join(Lesson.users)
            .where(User.id == user_id)
            .order_by(Lesson.number)
        ).all()


def get_lesson_by_id(lesson_id: int, user_id: int) -> Lesson:
    with DBsession.begin() as session:
        lesson = session.scalars(
            select(Lesson)
            .where(Lesson.id == lesson_id)
            .join(Lesson.users)
            .where(User.id == user_id)
        ).one_or_none()

        # TODO move code after to Upper Layer
        if lesson is not None:
            return lesson

        lesson = session.scalars(select(Lesson).where(Lesson.id == lesson_id)).one_or_none()

        if lesson is not None:
            raise InvalidAPIUsage("You do not have access to this lesson!", 403, {"course_id": lesson.course_id})

        raise LessonNotFoundException(lesson_id)


#########################################################################################################################
################ Activity ###############################################################################################
#########################################################################################################################
class ActivityQueries(Generic[ActivityType, ActivityTryType]):
    _activity_type: type[ActivityType]
    _activityTry_type: type[ActivityTryType]

    def __init__(self, activity_type: type[ActivityType], activity_try_type: type[ActivityTryType]):
        self._activity_type = activity_type
        self._activityTry_type = activity_try_type

    def get_by_lesson_id(self, lesson_id: int, user_id: int) -> ActivityType | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_type)
                .join(self._activity_type.lesson)
                .where(Lesson.id == lesson_id)
                .join(Lesson.users)
                .where(User.id == user_id)
            ).one_or_none()

    def get_by_id(self, activity_id: int, user_id: int) -> ActivityType:
        with DBsession.begin() as session:
            activity = session.scalars(
                select(self._activity_type)
                .where(self._activity_type.id == activity_id)
                .join(self._activity_type.lesson)
                .join(Lesson.users)
                .where(User.id == user_id)
            ).one_or_none()

            # TODO move code after to Upper Layer
            if activity is not None:
                return activity

            activity = session.scalars(
                select(self._activity_type)
                .where(self._activity_type.id == activity_id)
            ).one_or_none()

            if activity is not None:
                raise InvalidAPIUsage(f"You do not have access to this {self._activity_type.__name__}!", 403,
                                      {"lesson_id": activity.lesson_id})

            raise ActivityNotFoundException(self._activity_type.__name__)

    def get_tries_by_activity_id(self, activity_id: int, user_id: int) -> list[ActivityTryType]:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activityTry_type)
                .join(self._activityTry_type.base)
                .where(self._activity_type.id == activity_id)
                .join(self._activity_type.lesson)
                .join(Lesson.users)
                .where(User.id == user_id)
                .order_by(self._activityTry_type.try_number)
            ).all()

    def get_unfinished_try_by_activity_id(self, activity_id: int, user_id: int) -> ActivityTryType:
        with DBsession.begin() as session:
            activity_try = session.scalars(
                select(self._activityTry_type)
                .where(self._activityTry_type.end_datetime == None)
                .join(self._activityTry_type.base)
                .where(self._activity_type.id == activity_id)
                .join(self._activity_type.lesson)
                .join(Lesson.users).where(User.id == user_id)
            ).one_or_none()

            # TODO move code after to Upper Layer
            if activity_try is not None:
                return activity_try

            activity = session.scalars(
                select(self._activity_type)
                .where(self._activity_type.id == activity_id)
            ).one_or_none()

            if activity_try is not None:
                raise InvalidAPIUsage(f"{self._activity_type.__name__} not started!", 403,
                                      {"lesson_id": activity.lesson_id})

            raise ActivityNotFoundException(self._activity_type.__name__)


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################
class LexisQueries(ActivityQueries[LexisType, LexisTryType], Generic[LexisType, LexisTryType, LexisCardType]):
    _lexis_card_type: type[LexisCardType]

    def __init__(self, lexis_type: type[LexisType],
                 lexis_try_type: type[LexisTryType],
                 lexis_card_type: type[LexisCardType]):
        super().__init__(lexis_type, lexis_try_type)
        self._lexis_card_type = lexis_card_type

    def add_new_try(self, try_number: int, activity_id: int, user_id: int) -> LexisTryType:
        with DBsession.begin() as session:
            LogI(f"Add New Activity Try {self._activityTry_type.__name__}: ", try_number, activity_id, user_id)

            new_activity_try = self._activityTry_type(try_number=try_number,
                                                      start_datetime=datetime.now(),
                                                      user_id=user_id,
                                                      base_id=activity_id)
            session.add(new_activity_try)
            return new_activity_try

    def set_done_tasks_in_try(self, activity_try_id: int, done_tasks: str) -> None:
        with DBsession.begin() as session:
            session.execute(
                update(self._activityTry_type)
                .where(self._activityTry_type.id == activity_try_id)
                .values(done_tasks=done_tasks)
            )

    def get_cards_by_activity_id(self, activity_id: int) -> list[LexisCardType]:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._lexis_card_type)
                .where(self._lexis_card_type.base_id == activity_id)
            ).all()


#########################################################################################################################
################ Drilling and Hieroglyph ################################################################################
#########################################################################################################################
DrillingQueries = LexisQueries(Drilling, DrillingTry, DrillingCard)
HieroglyphQueries = LexisQueries(Hieroglyph, HieroglyphTry, HieroglyphCard)


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
        with DBsession.begin() as session:
            new_activity_try = self._activityTry_type(try_number=try_number,
                                                      start_datetime=datetime.now(),
                                                      user_id=user_id,
                                                      done_tasks=tasks,
                                                      checked_tasks=checked_tasks,
                                                      base_id=activity_id)
            session.add(new_activity_try)
            return new_activity_try

    def add_done_and_check_tasks(self, activity_id: int, done_tasks, checked_tasks):
        with DBsession.begin() as session:
            session.execute(
                update(self._activityTry_type)
                .where(self._activityTry_type.id == activity_id)
                .values(done_tasks=done_tasks, checked_tasks=checked_tasks)
            )

    def get_done_tries_by_activity_id(self, activity_id: int, user_id: int) -> list[AssessmentTryType]:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activityTry_type)
                .where(self._activityTry_type.end_datetime != None)
                .join(self._activityTry_type.base)
                .where(self._activity_type.id == activity_id)
                .join(self._activity_type.lesson)
                .join(Lesson.users)
                .where(User.id == user_id)
                .order_by(self._activityTry_type.try_number.desc())
            ).all()

    def get_done_try_by_id(self, activity_try_id: int, user_id: int) -> AssessmentTryType:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activityTry_type)
                .where(self._activityTry_type.id == activity_try_id)
                .where(self._activityTry_type.end_datetime != None)
                .join(self._activityTry_type.base)
                .join(self._activity_type.lesson)
                .join(Lesson.users)
                .where(User.id == user_id)
            ).one_or_none()


AssessmentQueries = AssessmentQueriesClass[Assessment, AssessmentTry](Assessment, AssessmentTry)
FinalBossQueries = AssessmentQueriesClass[FinalBoss, FinalBossTry](FinalBoss, FinalBossTry)


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def add_user_dictionary_if_not_exists(dictionary_id: int, user_id: int) -> UserDictionary:
    with DBsession.begin() as session:
        dictinary = session.scalars(
            select(UserDictionary)
            .where(UserDictionary.dictionary_id == dictionary_id)
            .where(UserDictionary.user_id == user_id)
        ).one_or_none()

        if dictinary is None:
            dictinary = UserDictionary(user_id=user_id, dictionary_id=dictionary_id)
            session.add(dictinary)

        return dictinary


def get_ditcionary_item(dictionary_id: int, user_id: int) -> tuple[Dictionary, UserDictionary]:
    with DBsession.begin() as session:
        result = session.execute(
            select(Dictionary, UserDictionary)
            .join(UserDictionary.dictionary)
            .where(Dictionary.id == dictionary_id)
            .where(UserDictionary.user_id == user_id)
        ).one_or_none()
        print(result)
        return result


def get_dictionary(user_id: int) -> list[tuple[Dictionary, UserDictionary]]:
    with DBsession.begin() as session:
        return session.execute(
            select(Dictionary, UserDictionary)
            .join(UserDictionary.dictionary)
            .where(UserDictionary.user_id == user_id)
        ).all()


def add_img_to_dictionary(dictionary_img_req: DictionaryImgReq, user_id: int):
    dictionary_item = add_user_dictionary_if_not_exists(dictionary_img_req.dictionary_id, user_id)

    with DBsession.begin() as session:
        session.execute(
            update(UserDictionary)
            .where(UserDictionary.id == dictionary_item.id)
            .values(img=dictionary_img_req.url)
        )


def add_association_to_dictionary(dictionary_association_req: DictionaryAssociationReq, user_id: int):
    dictionary_item = add_user_dictionary_if_not_exists(dictionary_association_req.dictionary_id, user_id)

    with DBsession.begin() as session:
        session.execute(
            update(UserDictionary)
            .where(UserDictionary.id == dictionary_item.id)
            .values(association=dictionary_association_req.association)
        )


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
    with DBsession.begin() as session:
        session.add(NotificationStudentToTeacher(final_boss_try_id=final_boss_try_id))


def add_assessment_notification(assessment_try_id: int):
    with DBsession.begin() as session:
        session.add(NotificationStudentToTeacher(assessment_try_id=assessment_try_id))


def add_drilling_notification(drilling_try_id: int):
    with DBsession.begin() as session:
        session.add(NotificationStudentToTeacher(drilling_try_id=drilling_try_id))


def add_hieroglyph_notification(hieroglyph_try_id: int):
    with DBsession.begin() as session:
        session.add(NotificationStudentToTeacher(hieroglyph_try_id=hieroglyph_try_id))
