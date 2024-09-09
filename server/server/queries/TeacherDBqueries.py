from typing import Generic, Type

from sqlalchemy import Delete, Select, delete, select, update

from server.common import DBsession
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.models.assessment import AssessmentCreateReqStr
from server.models.course import CourseCreateReq
from server.models.db_models import (ActivityTryType, Assessment, AssessmentTry, AssessmentTryType, AssessmentType,
                                     Course, Dictionary, Drilling, DrillingCard, DrillingTry, FinalBoss, FinalBossTry,
                                     Hieroglyph, HieroglyphCard, HieroglyphTry, Lesson, LexisCardType, LexisTryType,
                                     LexisType, NotificationStudentToTeacher, NotificationTeacherToStudent, User,
                                     UserDictionary, a_users_courses, a_users_lessons)
from server.models.dictionary import (DictionaryCreateReq, DictionaryCreateReqItem)
from server.models.lesson import LessonCreateReq
from server.models.lexis import LexisCardCreateReq, LexisCreateReq


#########################################################################################################################
################ User ###################################################################################################
#########################################################################################################################
def get_all_students() -> list[User]:
    with DBsession.begin() as session:
        return session.scalars(select(User).where(User.level == User.Level.STUDENT)).all()


#########################################################################################################################
################ Course #################################################################################################
#########################################################################################################################
def get_all_courses() -> list[Course]:
    with DBsession.begin() as session:
        return session.scalars(select(Course).order_by(Course.sort).order_by(Course.id)).all()


def get_course_by_id(course_id: int) -> Course | None:
    with DBsession.begin() as session:
        return session.scalars(select(Course).where(Course.id == course_id)).one_or_none()


def create_course(course_data: CourseCreateReq) -> Course:
    with DBsession.begin() as session:
        course = Course(**course_data.model_dump())
        session.add(course)
        return course


def update_course(course_id: int, course_data: CourseCreateReq):
    with DBsession.begin() as session:
        session.execute(update(Course).where(Course.id == course_id).values(**course_data.model_dump()))


def delete_course_by_id(course_id: int):
    with DBsession.begin() as session:
        session.execute(delete(Course).where(Course.id == course_id))


def get_students_inside_course(course_id: int) -> list[User]:
    with DBsession.begin() as session:
        return session.scalars(
            select(User).where(User.level == User.Level.STUDENT).join(
                User.courses).where(Course.id == course_id)).all()


def is_student_inside_course(course_id: int, user_id: int) -> bool:
    with DBsession.begin() as session:
        return session.scalars(select(User).join(
            User.courses).where(Course.id == course_id).where(User.id == user_id)).one_or_none() is not None


def add_user_to_course(course_id: int, user_id: int):
    with DBsession.begin() as session:
        session.execute(a_users_courses.insert().values(course_id=course_id, user_id=user_id))


def remove_user_from_course(course_id: int, user_id: int):
    with DBsession.begin() as session:
        session.execute(a_users_courses.delete().where(a_users_courses.c.course_id == course_id).where(
            a_users_courses.c.user_id == user_id))


#########################################################################################################################
################ Lesson #################################################################################################
#########################################################################################################################
def get_lessons_by_course_id(course_id: int) -> list[Lesson]:
    with DBsession.begin() as session:
        return session.scalars(
            select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.number).order_by(Lesson.id)).all()


def get_lesson_by_id(lesson_id: int) -> Lesson | None:
    with DBsession.begin() as session:
        return session.scalars(select(Lesson).where(Lesson.id == lesson_id)).one_or_none()


def create_lesson(course_id: int, lesson_data: LessonCreateReq) -> Lesson:
    with DBsession.begin() as session:
        lesson = Lesson(course_id=course_id, **lesson_data.model_dump())
        session.add(lesson)
        return lesson


def update_lesson(lesson_id: int, lesson_data: LessonCreateReq):
    with DBsession.begin() as session:
        session.execute(update(Lesson).where(Lesson.id == lesson_id).values(**lesson_data.model_dump()))


def delete_lesson_by_id(lesson_id: int):
    with DBsession.begin() as session:
        session.execute(delete(Lesson).where(Lesson.id == lesson_id))


def get_students_inside_lesson(lesson_id: int) -> list[User]:
    with DBsession.begin() as session:
        return session.scalars(
            select(User).where(User.level == User.Level.STUDENT).join(
                User.lessons).where(Lesson.id == lesson_id)).all()


def is_student_inside_lesson(lesson_id: int, user_id: int) -> bool:
    with DBsession.begin() as session:
        return session.scalars(select(User).join(
            User.lessons).where(Lesson.id == lesson_id).where(User.id == user_id)).one_or_none() is not None


def add_user_to_lesson(lesson_id: int, user_id: int):
    with DBsession.begin() as session:
        session.execute(a_users_lessons.insert().values(lesson_id=lesson_id, user_id=user_id))


def remove_user_from_lesson(lesson_id: int, user_id: int):
    with DBsession.begin() as session:
        session.execute(a_users_lessons.delete().where(a_users_lessons.c.lesson_id == lesson_id).where(
            a_users_lessons.c.user_id == user_id))


#########################################################################################################################
################ Activity ###############################################################################################
#########################################################################################################################
def modify_delete_by_activity_try_type(activity_try_type: type[ActivityTryType], query: Delete, ids: Select) -> str:
    if activity_try_type == DrillingTry:
        return query.where(NotificationStudentToTeacher.drilling_try_id.in_(ids))
    if activity_try_type == HieroglyphTry:
        return query.where(NotificationStudentToTeacher.hieroglyph_try_id.in_(ids))
    if activity_try_type == AssessmentTry:
        return query.where(NotificationStudentToTeacher.assessment_try_id.in_(ids))
    if activity_try_type == FinalBossTry:
        return query.where(NotificationStudentToTeacher.final_boss_try_id.in_(ids))

    return ""


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################
class LexisQueries(Generic[LexisType, LexisTryType, LexisCardType]):
    lexis_type: Type[LexisType]
    lexis_try_type: Type[LexisTryType]
    lexis_card_type: Type[LexisCardType]

    def __init__(self, lexis_type: Type[LexisType], lexis_try_type: Type[LexisTryType],
                 lexis_card_type: Type[LexisCardType]):
        self.lexis_type = lexis_type
        self.lexis_try_type = lexis_try_type
        self.lexis_card_type = lexis_card_type

    def get_by_lesson_id(self, lessond_id: int) -> LexisType | None:
        with DBsession.begin() as session:
            return session.scalars(select(self.lexis_type).where(self.lexis_type.lesson_id == lessond_id)).one_or_none()

    def get_by_id(self, lexis_id: int) -> LexisType | None:
        with DBsession.begin() as session:
            return session.scalars(select(self.lexis_type).where(self.lexis_type.id == lexis_id)).one_or_none()

    def get_user_by_try_id(self, lexis_try_id: int) -> int | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(User).join(self.lexis_try_type).where(self.lexis_try_type.id == lexis_try_id)).one_or_none()

    def get_try_by_id(self, lexis_try_id: int) -> LexisTryType | None:
        with DBsession.begin() as session:
            return session.scalars(select(
                self.lexis_try_type).where(self.lexis_try_type.id == lexis_try_id)).one_or_none()

    def get_cards_by_activity_id(self, lexis_id: int) -> list[LexisCardType]:
        with DBsession.begin() as session:
            return session.scalars(select(self.lexis_card_type).where(self.lexis_card_type.base_id == lexis_id)).all()

    def create_cards(self, lexis_id: int, cards_data: LexisCardCreateReq):
        with DBsession.begin() as session:
            cards: list[LexisCardType] = []
            for item in cards_data.cards:
                cards.append(self.lexis_card_type(base_id=lexis_id, **item.model_dump()))

            session.add_all(cards)

    def create(self, lesson_id: int, lexis_data: LexisCreateReq) -> LexisType:
        with DBsession.begin() as session:
            lexis: LexisType = self.lexis_type(lesson_id=lesson_id, **lexis_data.model_dump())

            session.add(lexis)

            return lexis

    def update(self, lexis_id: int, lexis_data: LexisCreateReq):
        with DBsession.begin() as session:
            session.execute(
                update(self.lexis_type).where(self.lexis_type.id == lexis_id).values(**lexis_data.model_dump()))

    def delete_by_id(self, lexis_id: int):
        with DBsession.begin() as session:
            session.execute(delete(self.lexis_type).where(self.lexis_type.id == lexis_id))

    def delete_cards_by_activity_id(self, lexis_try_id: int):
        with DBsession.begin() as session:
            session.execute(delete(self.lexis_card_type).where(self.lexis_card_type.base_id == lexis_try_id))

    def delete_tries_by_activity_id(self, lexis_try_id: int):
        with DBsession.begin() as session:
            session.execute(delete(self.lexis_try_type).where(self.lexis_try_type.base_id == lexis_try_id))

    def delete_notifications_by_activity_id(self, lexis_id: int):
        with DBsession.begin() as session:
            session.execute(
                modify_delete_by_activity_try_type(
                    self.lexis_try_type, delete(NotificationStudentToTeacher),
                    select(self.lexis_try_type.id).where(self.lexis_try_type.base_id == lexis_id)))


DrillingQueries = LexisQueries(Drilling, DrillingTry, DrillingCard)
HieroglyphQueries = LexisQueries(Hieroglyph, HieroglyphTry, HieroglyphCard)


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
class IAssessmentQueries(Generic[AssessmentType, AssessmentTryType]):
    assessment_type: type[AssessmentType]
    assessment_try_type: type[AssessmentTryType]

    def __init__(self, assessment_type: type[AssessmentType], assessment_try_type: type[AssessmentTryType]):
        self.assessment_type = assessment_type
        self.assessment_try_type = assessment_try_type

    def get_by_id(self, assessment_id: int) -> AssessmentType | None:
        with DBsession.begin() as session:
            return session.scalars(select(
                self.assessment_type).where(self.assessment_type.id == assessment_id)).one_or_none()

    def get_by_lesson_id(self, lesson_id: int) -> AssessmentType | None:
        with DBsession.begin() as session:
            return session.scalars(select(
                self.assessment_type).where(self.assessment_type.lesson_id == lesson_id)).one_or_none()

    def create(self, lesson_id: int, assessment_data: AssessmentCreateReqStr):
        with DBsession.begin() as session:
            assessment = self.assessment_type(lesson_id=lesson_id, **assessment_data.model_dump())

            session.add(assessment)

            return assessment

    def update(self, assessment_id: int, assessment_data: AssessmentCreateReqStr):
        with DBsession.begin() as session:
            session.execute(
                update(self.assessment_type).where(self.assessment_type.id == assessment_id).values(
                    **assessment_data.model_dump()))

    def get_user_by_try_id(self, assessment_try_id: int) -> int | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(User).join(
                    self.assessment_try_type).where(self.assessment_try_type.id == assessment_try_id)).one_or_none()

    def get_try_by_id(self, assessment_try_id: int) -> LexisTryType | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(self.assessment_try_type).where(self.assessment_try_type.id == assessment_try_id)).one_or_none()

    def get_done_try_by_id(self, assessment_id: int) -> AssessmentTryType | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(self.assessment_try_type).where(self.assessment_try_type.id == assessment_id).where(
                    self.assessment_try_type.end_datetime != None)).one_or_none()

    def set_done_try_checks(self, assessment_try_id: int, checks_json: str):
        with DBsession.begin() as session:
            session.execute(
                update(self.assessment_try_type).where(self.assessment_try_type.id == assessment_try_id).values(
                    checked_tasks=checks_json))

    def delete_by_id(self, assessment_id: int):
        with DBsession.begin() as session:
            session.execute(delete(self.assessment_type).where(self.assessment_type.id == assessment_id))

    def delete_tries_by_activity_id(self, assessment_id: int):
        with DBsession.begin() as session:
            session.execute(delete(self.assessment_try_type).where(self.assessment_try_type.base_id == assessment_id))

    def modify_delete_checks_notifications(self, query: Delete, ids: Select):
        if self.assessment_try_type == AssessmentTry:
            return query.where(NotificationTeacherToStudent.assessment_try_id.in_(ids))
        if self.assessment_try_type == FinalBossTry:
            return query.where(NotificationTeacherToStudent.final_boss_try_id.in_(ids))

    def delete_notifications_by_activity_id(self, assessment_id: int):
        with DBsession.begin() as session:
            session.execute(
                modify_delete_by_activity_try_type(
                    self.assessment_try_type, delete(NotificationStudentToTeacher),
                    select(self.assessment_try_type.id).where(self.assessment_try_type.base_id == assessment_id)))

            session.execute(
                self.modify_delete_checks_notifications(
                    delete(NotificationTeacherToStudent),
                    select(self.assessment_try_type.id).where(self.assessment_try_type.base_id == assessment_id)))


AssessmentQueries = IAssessmentQueries(Assessment, AssessmentTry)
FinalBossQueries = IAssessmentQueries(FinalBoss, FinalBossTry)


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def get_dictionary() -> list[Dictionary]:
    with DBsession.begin() as session:
        return session.scalars(select(Dictionary)).all()


def get_dictionary_list(ids: list[int]) -> list[Dictionary]:
    with DBsession.begin() as session:
        return session.scalars(select(Dictionary).where(Dictionary.id.in_(ids))).all()


def get_dictionary_item(item: DictionaryCreateReqItem) -> Dictionary | None:
    with DBsession.begin() as session:
        base_filter = select(Dictionary).where(Dictionary.ru == item.ru)
        filter_char_jp = base_filter.where(Dictionary.char_jp == item.char_jp)
        filter_word_jp = base_filter.where(Dictionary.word_jp == item.word_jp)
        filter_full_jp = filter_char_jp.where(Dictionary.word_jp == item.word_jp)

        if item.word_jp is not None and item.char_jp is not None:
            if res := session.scalars(filter_full_jp).one_or_none():
                return res
        if item.char_jp is not None:
            if res := session.scalars(filter_char_jp).one_or_none():
                return res
        if item.word_jp is not None:
            if res := session.scalars(filter_word_jp).one_or_none():
                return res

        return session.scalars(base_filter).one_or_none()


def create_or_get_dictionary(dictionary_data: DictionaryCreateReq) -> list[Dictionary]:
    with DBsession.begin() as session:
        result: list[Dictionary] = []

        for item in dictionary_data.words:
            dictionary_item = get_dictionary_item(item)

            if dictionary_item is None:
                dictionary_item = Dictionary(**item.model_dump())
                session.add(dictionary_item)

            if (dictionary_item.char_jp is None and item.char_jp is not None):
                session.execute(
                    update(Dictionary).where(Dictionary.id == dictionary_item.id).values(char_jp=item.char_jp))
                dictionary_item.char_jp = item.char_jp

            if (dictionary_item.word_jp is None and item.word_jp is not None):
                session.execute(
                    update(Dictionary).where(Dictionary.id == dictionary_item.id).values(word_jp=item.word_jp))
                dictionary_item.word_jp = item.word_jp

            result.append(dictionary_item)

        return result


def add_img_to_dictionary(id: int, url: str):
    with DBsession.begin() as session:
        dictionary_item: Dictionary = session.scalars(select(Dictionary).where(Dictionary.id == id)).one_or_none()

        if dictionary_item is None:
            raise InvalidAPIUsage(f"Can't find dict item with id {id}", 404)

        dictionary_item.img = url


def clear_dictionary():
    with DBsession.begin() as session:
        session.execute(
            delete(Dictionary).where(Dictionary.id.not_in(select(DrillingCard.dictionary_id))).where(
                Dictionary.id.not_in(select(HieroglyphCard.dictionary_id))).where(
                    Dictionary.id.not_in(select(UserDictionary.dictionary_id))))


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
def get_notifications() -> list[NotificationStudentToTeacher]:
    with DBsession.begin() as session:
        return session.scalars(
            select(NotificationStudentToTeacher).where(NotificationStudentToTeacher.deleted == False).order_by(
                NotificationStudentToTeacher.creation_datetime.desc())).all()


def add_course_notification(course_id: int, student_id: int):
    with DBsession.begin() as session:
        session.add(NotificationTeacherToStudent(course_id=course_id, student_id=student_id))


def add_lesson_notification(lesson_id: int, student_id: int):
    with DBsession.begin() as session:
        session.add(NotificationTeacherToStudent(lesson_id=lesson_id, student_id=student_id))


def add_final_boss_notification(final_boss_try_id: int):
    with DBsession.begin() as session:
        session.add(NotificationTeacherToStudent(final_boss_try_id=final_boss_try_id))


def add_assessment_notification(assessment_try_id: int):
    with DBsession.begin() as session:
        session.add(NotificationTeacherToStudent(assessment_try_id=assessment_try_id))


# def get_notification_activity_try(
#         activity_try_type:
#             Literal["drilling_try"] |
#             Literal["hieroglyph_try"] |
#             Literal["assessment_try"] |
#             Literal["final_boss_try"],
#         activity_try_id: int):
