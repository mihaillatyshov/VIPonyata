from datetime import datetime
from typing import Generic, TypedDict

from sqlalchemy import select, union_all, update
from sqlalchemy.sql.expression import func

from server.common import DBsession
from server.exceptions.ApiExceptions import (ActivityNotFoundException, CourseNotFoundException, InvalidAPIUsage,
                                             LessonNotFoundException)
from server.log_lib import LogI
from server.models.db_models import (ActivityTryType, ActivityType, Assessment, AssessmentTry, AssessmentTryType,
                                     AssessmentType, Course, Dictionary, Drilling, DrillingCard, DrillingTry, FinalBoss,
                                     FinalBossTry, Hieroglyph, HieroglyphCard, HieroglyphTry, Lesson, LexisCardType,
                                     LexisTryType, LexisType, NotificationStudentToTeacher,
                                     NotificationTeacherToStudent, User, UserDictionary)
from server.models.dictionary import DictionaryAssociationReq, DictionaryImgReq


#########################################################################################################################
################ Course and Lesson ######################################################################################
#########################################################################################################################
def get_available_courses(user_id: int) -> list[Course]:
    with DBsession.begin() as session:
        return session.scalars(
            select(Course).join(Course.users).where(User.id == user_id).order_by(Course.sort).order_by(
                Course.id)).all()


def get_course_by_id_new(course_id: int, user_id: int) -> Course | None:
    with DBsession.begin() as session:
        return session.scalars(
            select(Course).where(Course.id == course_id).join(Course.users).where(User.id == user_id)).one_or_none()


def get_course_by_id(course_id: int, user_id: int) -> Course:
    with DBsession.begin() as session:
        course = session.scalars(
            select(Course).where(Course.id == course_id).join(Course.users).where(User.id == user_id)).one_or_none()

        # TODO move code after to Upper Layer
        if course is not None:
            return course

        if session.scalars(select(Course).where(Course.id == course_id)).one_or_none():
            raise InvalidAPIUsage("You do not have access to this course!", 403)

        raise CourseNotFoundException(course_id)


def get_lessons_by_course_id(course_id: int, user_id: int) -> list[Lesson]:
    with DBsession.begin() as session:
        return session.scalars(
            select(Lesson).where(Lesson.course_id == course_id).join(Lesson.users).where(User.id == user_id).order_by(
                Lesson.number).order_by(Lesson.id)).all()


def get_lesson_by_id_new(lesson_id: int, user_id: int) -> Lesson | None:
    with DBsession.begin() as session:
        return session.scalars(
            select(Lesson).where(Lesson.id == lesson_id).join(Lesson.users).where(User.id == user_id)).one_or_none()


def get_lesson_by_id(lesson_id: int, user_id: int) -> Lesson:
    with DBsession.begin() as session:
        lesson = session.scalars(
            select(Lesson).where(Lesson.id == lesson_id).join(Lesson.users).where(User.id == user_id)).one_or_none()

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
class ActivityForNotificationType(TypedDict):
    id: int
    lesson_id: int


class ActivityTryForNotificationType(TypedDict):
    id: int
    base_id: int
    start_datetime: datetime
    end_datetime: datetime


class ActivityQueries(Generic[ActivityType, ActivityTryType]):
    _activity_type: type[ActivityType]
    _activity_try_type: type[ActivityTryType]

    def __init__(self, activity_type: type[ActivityType], activity_try_type: type[ActivityTryType]):
        self._activity_type = activity_type
        self._activity_try_type = activity_try_type

    def get_by_lesson_id(self, lesson_id: int, user_id: int) -> ActivityType | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_type).join(self._activity_type.lesson).where(Lesson.id == lesson_id).join(
                    Lesson.users).where(User.id == user_id)).one_or_none()

    def get_by_id_new(self, activity_id: int, user_id: int) -> ActivityType | None:
        with DBsession.begin() as session:
            return session.scalars(                                                                                     #
                select(self._activity_type)                                                                             #
                .where(self._activity_type.id == activity_id)                                                           #
                .join(self._activity_type.lesson)                                                                       #
                .join(Lesson.users)                                                                                     #
                .where(User.id == user_id)                                                                              #
            ).one_or_none()

    def get_for_notifications_by_id(self, activity_id: int, user_id: int) -> ActivityForNotificationType | None:
        with DBsession.begin() as session:
            result = session.execute(                                                                                   #
                select(self._activity_type.id, self._activity_type.lesson_id)                                           #
                .where(self._activity_type.id == activity_id)                                                           #
                .join(self._activity_type.lesson)                                                                       #
                .join(Lesson.users)                                                                                     #
                .where(User.id == user_id)                                                                              #
            ).one_or_none()

            if result is None:
                return None

            return {"id": result[0], "lesson_id": result[1]}

    def get_by_id(self, activity_id: int, user_id: int) -> ActivityType:
        with DBsession.begin() as session:
            activity = session.scalars(
                select(self._activity_type).where(self._activity_type.id == activity_id).join(
                    self._activity_type.lesson).join(Lesson.users).where(User.id == user_id)).one_or_none()

            # TODO move code after to Upper Layer
            if activity is not None:
                return activity

            activity = session.scalars(select(
                self._activity_type).where(self._activity_type.id == activity_id)).one_or_none()

            if activity is not None:
                raise InvalidAPIUsage(f"You do not have access to this {self._activity_type.__name__}!", 403,
                                      {"lesson_id": activity.lesson_id})

            raise ActivityNotFoundException(self._activity_type.__name__)

    def get_tries_by_activity_id(self, activity_id: int, user_id: int) -> list[ActivityTryType]:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_try_type).where(self._activity_try_type.user_id == user_id).join(
                    self._activity_try_type.base).where(self._activity_type.id == activity_id).order_by(
                        self._activity_try_type.try_number)).all()

    def get_unfinished_try_by_activity_id(self, activity_id: int, user_id: int) -> ActivityTryType:
        with DBsession.begin() as session:
            activity_try = session.scalars(
                select(self._activity_try_type).where(self._activity_try_type.end_datetime == None).where(
                    self._activity_try_type.user_id == user_id).join(
                        self._activity_try_type.base).where(self._activity_type.id == activity_id)).one_or_none()

            # TODO move code after to Upper Layer
            if activity_try is not None:
                return activity_try

            activity = session.scalars(select(
                self._activity_type).where(self._activity_type.id == activity_id)).one_or_none()

            if activity_try is not None:
                raise InvalidAPIUsage(f"{self._activity_type.__name__} not started!", 403,
                                      {"lesson_id": activity.lesson_id})

            raise ActivityNotFoundException(self._activity_type.__name__)


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################
class LexisQueries(ActivityQueries[LexisType, LexisTryType], Generic[LexisType, LexisTryType, LexisCardType]):
    _lexis_card_type: type[LexisCardType]

    def __init__(self, lexis_type: type[LexisType], lexis_try_type: type[LexisTryType],
                 lexis_card_type: type[LexisCardType]):
        super().__init__(lexis_type, lexis_try_type)
        self._lexis_card_type = lexis_card_type

    def add_new_try(self, try_number: int, activity_id: int, user_id: int) -> LexisTryType:
        with DBsession.begin() as session:
            new_activity_try = self._activity_try_type(try_number=try_number,
                                                       start_datetime=datetime.now(),
                                                       user_id=user_id,
                                                       base_id=activity_id)
            session.add(new_activity_try)
            return new_activity_try

    def set_done_tasks_in_try(self, activity_try_id: int, done_tasks: str) -> None:
        with DBsession.begin() as session:
            session.execute(
                update(self._activity_try_type).where(self._activity_try_type.id == activity_try_id).values(
                    done_tasks=done_tasks))

    def get_cards_by_activity_id(self, activity_id: int) -> list[LexisCardType]:
        with DBsession.begin() as session:
            return session.scalars(select(
                self._lexis_card_type).where(self._lexis_card_type.base_id == activity_id)).all()


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
            new_activity_try = self._activity_try_type(try_number=try_number,
                                                       start_datetime=datetime.now(),
                                                       user_id=user_id,
                                                       done_tasks=tasks,
                                                       checked_tasks=checked_tasks,
                                                       base_id=activity_id)
            session.add(new_activity_try)
            return new_activity_try

    def add_done_and_check_tasks(self, activity_try_id: int, done_tasks, checked_tasks):
        with DBsession.begin() as session:
            session.execute(
                update(self._activity_try_type).where(self._activity_try_type.id == activity_try_id).values(
                    done_tasks=done_tasks, checked_tasks=checked_tasks))

    def get_done_tries_by_activity_id(self, activity_id: int, user_id: int) -> list[AssessmentTryType]:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_try_type).where(self._activity_try_type.end_datetime != None).where(
                    self._activity_try_type.user_id == user_id).join(
                        self._activity_try_type.base).where(self._activity_type.id == activity_id).order_by(
                            self._activity_try_type.try_number.desc())).all()

    def get_done_try_by_id(self, activity_try_id: int, user_id: int) -> AssessmentTryType:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_try_type)                                                                         #
                .where(self._activity_try_type.id == activity_try_id)                                                   #
                .where(self._activity_try_type.end_datetime != None)                                                    #
                .where(self._activity_try_type.user_id == user_id)                                                      #
            ).one_or_none()

    def get_done_try_for_notifications_by_id(self, activity_try_id: int,
                                             user_id: int) -> ActivityTryForNotificationType | None:
        with DBsession.begin() as session:
            result = session.execute(                                                                                   #
                select(self._activity_try_type.id, self._activity_try_type.base_id,
                       self._activity_try_type.start_datetime, self._activity_try_type.end_datetime)                    #
                .where(self._activity_try_type.id == activity_try_id)                                                   #
                .where(self._activity_try_type.end_datetime != None)                                                    #
                .where(self._activity_try_type.user_id == user_id)                                                      #
            ).one_or_none()

            if result is None:
                return None

            return {"id": result[0], "base_id": result[1], "start_datetime": result[2], "end_datetime": result[3]}


AssessmentQueries = AssessmentQueriesClass[Assessment, AssessmentTry](Assessment, AssessmentTry)
FinalBossQueries = AssessmentQueriesClass[FinalBoss, FinalBossTry](FinalBoss, FinalBossTry)


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def add_user_dictionary_if_not_exists(dictionary_id: int, user_id: int) -> UserDictionary:
    with DBsession.begin() as session:
        dictinary = session.scalars(
            select(UserDictionary).where(UserDictionary.dictionary_id == dictionary_id).where(
                UserDictionary.user_id == user_id)).one_or_none()

        if dictinary is None:
            dictinary = UserDictionary(user_id=user_id, dictionary_id=dictionary_id)
            session.add(dictinary)

        return dictinary


def get_ditcionary_item(dictionary_id: int, user_id: int) -> tuple[Dictionary, UserDictionary]:
    with DBsession.begin() as session:
        result = session.execute(
            select(Dictionary, UserDictionary).join(UserDictionary.dictionary).where(
                Dictionary.id == dictionary_id).where(UserDictionary.user_id == user_id)).one_or_none()
        return result


def get_dictionary(user_id: int) -> list[tuple[Dictionary, UserDictionary]]:
    with DBsession.begin() as session:
        return session.execute(
            select(Dictionary,
                   UserDictionary).join(UserDictionary.dictionary).where(UserDictionary.user_id == user_id)).all()


def add_img_to_dictionary(dictionary_img_req: DictionaryImgReq, user_id: int):
    dictionary_item = add_user_dictionary_if_not_exists(dictionary_img_req.dictionary_id, user_id)

    with DBsession.begin() as session:
        session.execute(
            update(UserDictionary).where(UserDictionary.id == dictionary_item.id).values(img=dictionary_img_req.url))


def add_association_to_dictionary(dictionary_association_req: DictionaryAssociationReq, user_id: int):
    dictionary_item = add_user_dictionary_if_not_exists(dictionary_association_req.dictionary_id, user_id)

    with DBsession.begin() as session:
        session.execute(
            update(UserDictionary).where(UserDictionary.id == dictionary_item.id).values(
                association=dictionary_association_req.association))


def get_dictionary_count(user_id: int) -> int:
    with DBsession.begin() as session:
        return session.scalar(select(func.count()).select_from(UserDictionary).where(UserDictionary.user_id == user_id))


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
def get_notifications(user_id: int) -> list[NotificationTeacherToStudent]:
    with DBsession.begin() as session:
        select_query_student = (select(NotificationTeacherToStudent).where(
            NotificationTeacherToStudent.deleted == False).where(NotificationTeacherToStudent.student_id == user_id))

        select_query_assessment_try = (select(NotificationTeacherToStudent).where(
            NotificationTeacherToStudent.deleted == False).join(
                NotificationTeacherToStudent.assessment_try).where(AssessmentTry.user_id == user_id))

        select_query_final_boss_try = (select(NotificationTeacherToStudent).where(
            NotificationTeacherToStudent.deleted == False).join(
                NotificationTeacherToStudent.final_boss_try).where(FinalBossTry.user_id == user_id))

        return session.scalars(
            select(NotificationTeacherToStudent).from_statement(
                union_all(select_query_student, select_query_assessment_try, select_query_final_boss_try).order_by(
                    NotificationTeacherToStudent.creation_datetime.desc()))).all()


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


def mark_notifications_as_read(notification_ids: list[int]):
    with DBsession.begin() as session:
        # TODO: add check for user_id
        session.execute(                                                                                                #
            update(NotificationTeacherToStudent)                                                                        #
            .where(NotificationTeacherToStudent.id.in_(notification_ids))                                               #
            .values(viewed=True)                                                                                        #
        )
