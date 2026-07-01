from datetime import datetime
import json
from typing import Generic, Type, TypedDict

from sqlalchemy import Delete, Select, delete, select, update
from sqlalchemy.orm import selectinload

from server.common import DBsession
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.models.assessment import AssessmentCreateReqStr
from server.models.course import CourseCreateReq
from server.models.db_models import (
    ActivityTryType, Assessment, AssessmentTry, AssessmentTryType, AssessmentType, Course, Dictionary, Drilling,
    DrillingCard, DrillingTry, FinalBoss, FinalBossTry, HomeworkAssignment, HomeworkAssignmentTarget,
    HomeworkAssignmentTask, HomeworkTry, Hieroglyph, HieroglyphCard, HieroglyphTry, Lesson, LexisCardType, LexisTryType,
    LexisType, NotificationStudentToTeacher, NotificationTeacherToStudent, QuizletAssignment, QuizletAssignmentResult,
    QuizletAssignmentSubgroup, QuizletAssignmentTarget, QuizletAssignmentTargetSubgroup, QuizletDictionary,
    QuizletGroup, QuizletSubgroup, QuizletSubgroupWord, TaskBankHiddenLesson, TaskBankItem, User, UserDictionary,
    UserQuizletLesson, UserQuizletSubgroup, UserQuizletWord, QuizletSession, a_users_courses, a_users_lessons)
from server.models.dictionary import (DictionaryCreateReq, DictionaryCreateReqItem)
from server.models.lesson import LessonCreateReq
from server.models.lexis import LexisCardCreateReq, LexisCreateReq
from server.models.quizlet import (QuizletGroupCreateReq, QuizletSubgroupCreateReq, QuizletWordCreateReq,
                                   QuizletAssignmentCreateReq, QuizletWordsBatchCreateReq, QuizletWordUpdateReq)
from server.models.tasks import HomeworkAssignmentCreateReq, TaskBankItemCreateReq, TaskBankItemUpdateReq


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


class ActivityForNotificationType(TypedDict):
    id: int
    lesson_id: int


class ActivityTryForNotificationType(TypedDict):
    id: int
    base_id: int
    start_datetime: datetime
    end_datetime: datetime
    mistakes_count: int | None


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

    def get_for_notifications_by_id(self, lexis_id: int) -> ActivityForNotificationType | None:
        with DBsession.begin() as session:
            result = session.execute(                                                                                   #
                select(self.lexis_type.id, self.lexis_type.lesson_id)                                                   #
                .where(self.lexis_type.id == lexis_id)                                                                  #
            ).one_or_none()

            if result is None:
                return None

            return {"id": result[0], "lesson_id": result[1]}

    def get_user_by_try_id(self, lexis_try_id: int) -> int | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(User).join(self.lexis_try_type).where(self.lexis_try_type.id == lexis_try_id)).one_or_none()

    def get_try_by_id(self, lexis_try_id: int) -> LexisTryType | None:
        with DBsession.begin() as session:
            return session.scalars(                                                                                     #
                select(self.lexis_try_type)                                                                             #
                .where(self.lexis_try_type.id == lexis_try_id)                                                          #
            ).one_or_none()

    def get_try_for_notifications_by_id(self, lexis_try_id: int) -> ActivityTryForNotificationType | None:
        with DBsession.begin() as session:
            result = session.execute(                                                                                   #
                select(self.lexis_try_type.id, self.lexis_try_type.base_id, self.lexis_try_type.start_datetime,
                       self.lexis_try_type.end_datetime)                                                                #
                .where(self.lexis_try_type.id == lexis_try_id)                                                          #
            ).one_or_none()

            if result is None:
                return None

            return {
                "id": result[0],
                "base_id": result[1],
                "start_datetime": result[2],
                "end_datetime": result[3],
                "mistakes_count": None
            }

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

    def get_for_notifications_by_id(self, assessment_id: int) -> ActivityForNotificationType | None:
        with DBsession.begin() as session:
            result = session.execute(                                                                                   #
                select(self.assessment_type.id, self.assessment_type.lesson_id)                                         #
                .where(self.assessment_type.id == assessment_id)                                                        #
            ).one_or_none()

            if result is None:
                return None

            return {"id": result[0], "lesson_id": result[1]}

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

    def get_try_by_id(self, assessment_try_id: int) -> AssessmentTryType | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(self.assessment_try_type)                                                                        #
                .where(self.assessment_try_type.id == assessment_try_id)                                                #
            ).one_or_none()

    def get_try_for_notifications_by_id(self, assessment_try_id: int) -> ActivityTryForNotificationType | None:
        with DBsession.begin() as session:
            result = session.execute(                                                                                   #
                select(self.assessment_try_type.id, self.assessment_try_type.base_id,
                       self.assessment_try_type.start_datetime, self.assessment_try_type.end_datetime,
                       self.assessment_try_type.checked_tasks)                                                          #
                .where(self.assessment_try_type.id == assessment_try_id)                                                #
            ).one_or_none()

            if result is None:
                return None

            checked_tasks = json.loads(result[4] or "[]")
            mistakes_count = sum(task.get("mistakes_count", 0) for task in checked_tasks)
            return {
                "id": result[0],
                "base_id": result[1],
                "start_datetime": result[2],
                "end_datetime": result[3],
                "mistakes_count": mistakes_count
            }

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
################ Quizlet ################################################################################################
#########################################################################################################################
def get_quizlet_groups() -> list[QuizletGroup]:
    with DBsession.begin() as session:
        return session.scalars(select(QuizletGroup).order_by(QuizletGroup.sort).order_by(QuizletGroup.id)).all()


def get_quizlet_subgroups_by_group_ids(group_ids: list[int]) -> list[QuizletSubgroup]:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletSubgroup).where(QuizletSubgroup.group_id.in_(group_ids)).order_by(
                QuizletSubgroup.sort).order_by(QuizletSubgroup.id)).all()


def get_quizlet_words_by_subgroup_ids(subgroup_ids: list[int]) -> list[tuple[QuizletSubgroupWord, QuizletDictionary]]:
    if len(subgroup_ids) == 0:
        return []

    with DBsession.begin() as session:
        return session.execute(
            select(QuizletSubgroupWord, QuizletDictionary).join(QuizletSubgroupWord.word).where(
                QuizletSubgroupWord.subgroup_id.in_(subgroup_ids))).all()


def create_quizlet_group(data: QuizletGroupCreateReq) -> QuizletGroup:
    with DBsession.begin() as session:
        group = QuizletGroup(**data.model_dump())
        session.add(group)
        return group


def update_quizlet_group(group_id: int, data: QuizletGroupCreateReq):
    with DBsession.begin() as session:
        session.execute(update(QuizletGroup).where(QuizletGroup.id == group_id).values(**data.model_dump()))


def delete_quizlet_group(group_id: int):
    with DBsession.begin() as session:
        session.execute(delete(QuizletGroup).where(QuizletGroup.id == group_id))


def create_quizlet_subgroup(group_id: int, data: QuizletSubgroupCreateReq) -> QuizletSubgroup:
    with DBsession.begin() as session:
        subgroup = QuizletSubgroup(group_id=group_id, **data.model_dump())
        session.add(subgroup)
        return subgroup


def update_quizlet_subgroup(subgroup_id: int, data: QuizletSubgroupCreateReq):
    with DBsession.begin() as session:
        session.execute(update(QuizletSubgroup).where(QuizletSubgroup.id == subgroup_id).values(**data.model_dump()))


def delete_quizlet_subgroup(subgroup_id: int):
    with DBsession.begin() as session:
        session.execute(delete(QuizletSubgroup).where(QuizletSubgroup.id == subgroup_id))


def _create_teacher_quizlet_word(data: QuizletWordCreateReq) -> QuizletDictionary:
    with DBsession.begin() as session:
        word = QuizletDictionary(char_jp=data.char_jp, word_jp=data.word_jp, ru=data.ru, img=data.img, owner_id=None)
        session.add(word)
        return word


def add_quizlet_word(data: QuizletWordCreateReq) -> QuizletDictionary:
    word = _create_teacher_quizlet_word(data)

    with DBsession.begin() as session:
        exists_link = session.scalars(
            select(QuizletSubgroupWord).where(QuizletSubgroupWord.subgroup_id == data.subgroup_id).where(
                QuizletSubgroupWord.word_id == word.id)).one_or_none()
        if exists_link is None:
            session.add(QuizletSubgroupWord(subgroup_id=data.subgroup_id, word_id=word.id))

    return word


def update_quizlet_word(word_id: int, data: QuizletWordUpdateReq):
    with DBsession.begin() as session:
        session.execute(update(QuizletDictionary).where(QuizletDictionary.id == word_id).values(**data.model_dump()))


def remove_quizlet_word_from_subgroup(subgroup_id: int, word_id: int):
    with DBsession.begin() as session:
        session.execute(
            delete(QuizletSubgroupWord).where(QuizletSubgroupWord.subgroup_id == subgroup_id).where(
                QuizletSubgroupWord.word_id == word_id))


def delete_quizlet_word(word_id: int):
    with DBsession.begin() as session:
        session.execute(delete(QuizletDictionary).where(QuizletDictionary.id == word_id))


def batch_add_quizlet_words(data: QuizletWordsBatchCreateReq) -> list[QuizletDictionary]:
    return [add_quizlet_word(word) for word in data.words]


def get_quizlet_assignments_by_creator(teacher_id: int) -> list[QuizletAssignment]:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletAssignment).where(QuizletAssignment.created_by_id == teacher_id).order_by(
                QuizletAssignment.id.desc())).all()


def get_quizlet_assignment_by_id(assignment_id: int) -> QuizletAssignment | None:
    with DBsession.begin() as session:
        return session.scalars(select(QuizletAssignment).where(QuizletAssignment.id == assignment_id)).one_or_none()


def get_quizlet_assignment_subgroup_ids(assignment_id: int) -> list[int]:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletAssignmentSubgroup.subgroup_id).where(
                QuizletAssignmentSubgroup.assignment_id == assignment_id)).all()


def get_quizlet_subgroups_by_ids(subgroup_ids: list[int]) -> list[QuizletSubgroup]:
    if len(subgroup_ids) == 0:
        return []

    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletSubgroup).where(QuizletSubgroup.id.in_(subgroup_ids)).order_by(QuizletSubgroup.sort).order_by(
                QuizletSubgroup.id)).all()


def get_personal_quizlet_subgroups_by_ids(subgroup_ids: list[int]) -> list[UserQuizletSubgroup]:
    if len(subgroup_ids) == 0:
        return []

    with DBsession.begin() as session:
        return session.scalars(
            select(UserQuizletSubgroup).where(UserQuizletSubgroup.id.in_(subgroup_ids)).order_by(
                UserQuizletSubgroup.sort).order_by(UserQuizletSubgroup.id)).all()


def get_quizlet_assignment_targets(assignment_id: int) -> list[QuizletAssignmentTarget]:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletAssignmentTarget).where(QuizletAssignmentTarget.assignment_id == assignment_id)).all()


def cancel_quizlet_assignment_target(teacher_id: int, target_id: int) -> QuizletAssignmentTarget:
    with DBsession.begin() as session:
        target = session.scalars(
            select(QuizletAssignmentTarget).join(QuizletAssignment,
                                                 QuizletAssignment.id == QuizletAssignmentTarget.assignment_id).where(
                                                     QuizletAssignmentTarget.id == target_id).where(
                                                         QuizletAssignment.created_by_id == teacher_id)).one_or_none()
        if target is None:
            raise InvalidAPIUsage("Assignment target not found", 404)
        if target.status == QuizletAssignmentTarget.Status.COMPLETED:
            raise InvalidAPIUsage("Completed assignment cannot be cancelled", 400)

        target.status = QuizletAssignmentTarget.Status.CANCELLED
        target.completed_at = None
        session.flush()
        return target


def get_quizlet_assignment_results(assignment_id: int) -> list[QuizletAssignmentResult]:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletAssignmentResult).where(QuizletAssignmentResult.assignment_id == assignment_id)).all()


def get_quizlet_assignment_result_by_id(result_id: int) -> QuizletAssignmentResult | None:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletAssignmentResult).where(QuizletAssignmentResult.id == result_id)).one_or_none()


def get_history_quizlet_sessions() -> list[QuizletSession]:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletSession).options(selectinload(QuizletSession.words)).join(
                QuizletSession.user).where(User.level == User.Level.STUDENT).order_by(
                    QuizletSession.updated_at.desc()).order_by(QuizletSession.id.desc())).all()


def get_quizlet_assignment_target(assignment_id: int, student_id: int) -> QuizletAssignmentTarget | None:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletAssignmentTarget).where(QuizletAssignmentTarget.assignment_id == assignment_id).where(
                QuizletAssignmentTarget.student_id == student_id)).one_or_none()


def get_quizlet_subgroup_titles_by_dictionary_word_ids(word_ids: list[int]) -> list[str]:
    if len(word_ids) == 0:
        return []

    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletSubgroup.title).join(QuizletSubgroupWord,
                                               QuizletSubgroupWord.subgroup_id == QuizletSubgroup.id).where(
                                                   QuizletSubgroupWord.word_id.in_(word_ids)).distinct().order_by(
                                                       QuizletSubgroup.sort).order_by(QuizletSubgroup.id)).all()


def get_personal_quizlet_subgroup_titles_by_word_ids(word_ids: list[int]) -> list[str]:
    if len(word_ids) == 0:
        return []

    with DBsession.begin() as session:
        return session.scalars(
            select(UserQuizletSubgroup.title).join(
                UserQuizletWord, UserQuizletWord.subgroup_id == UserQuizletSubgroup.id).where(
                    UserQuizletWord.id.in_(word_ids)).distinct().order_by(UserQuizletSubgroup.sort).order_by(
                        UserQuizletSubgroup.id)).all()


def get_history_personal_quizlet_lessons() -> list[UserQuizletLesson]:
    with DBsession.begin() as session:
        return session.scalars(
            select(UserQuizletLesson).join(UserQuizletLesson.user).where(User.level == User.Level.STUDENT).order_by(
                UserQuizletLesson.created_at.desc()).order_by(UserQuizletLesson.id.desc())).all()


def get_history_personal_quizlet_subgroups() -> list[UserQuizletSubgroup]:
    with DBsession.begin() as session:
        return session.scalars(
            select(UserQuizletSubgroup).join(UserQuizletSubgroup.lesson).join(
                UserQuizletLesson.user).where(User.level == User.Level.STUDENT).order_by(
                    UserQuizletSubgroup.created_at.desc()).order_by(UserQuizletSubgroup.id.desc())).all()


def get_history_personal_quizlet_words() -> list[UserQuizletWord]:
    with DBsession.begin() as session:
        return session.scalars(
            select(UserQuizletWord).join(UserQuizletWord.subgroup).join(UserQuizletSubgroup.lesson).join(
                UserQuizletLesson.user).where(User.level == User.Level.STUDENT).order_by(
                    UserQuizletWord.created_at.desc()).order_by(UserQuizletWord.id.desc())).all()


def get_all_lessons_for_assignment() -> list[Lesson]:
    with DBsession.begin() as session:
        return session.scalars(select(Lesson).order_by(Lesson.course_id).order_by(Lesson.number).order_by(
            Lesson.id)).all()


def get_hidden_task_bank_lesson_ids() -> list[int]:
    with DBsession.begin() as session:
        return session.scalars(select(TaskBankHiddenLesson.lesson_id).order_by(TaskBankHiddenLesson.lesson_id)).all()


def hide_task_bank_lesson(lesson_id: int) -> TaskBankHiddenLesson:
    with DBsession.begin() as session:
        _ensure_task_bank_lesson_exists(session, lesson_id)

        hidden_lesson = session.scalars(
            select(TaskBankHiddenLesson).where(TaskBankHiddenLesson.lesson_id == lesson_id)).one_or_none()
        if hidden_lesson is not None:
            return hidden_lesson

        hidden_lesson = TaskBankHiddenLesson(lesson_id=lesson_id)
        session.add(hidden_lesson)
        session.flush()
        return hidden_lesson


def show_task_bank_lesson(lesson_id: int) -> None:
    with DBsession.begin() as session:
        hidden_lesson = session.scalars(
            select(TaskBankHiddenLesson).where(TaskBankHiddenLesson.lesson_id == lesson_id)).one_or_none()
        if hidden_lesson is None:
            return

        session.delete(hidden_lesson)


def _task_title_from_source(lesson_name: str, task_name: str, task_index: int, block_index: int | None) -> str:
    if block_index is None:
        return f"{lesson_name}_{task_name}_{task_index}"

    return f"{lesson_name}_блок_{block_index}_{task_name}_{task_index}"


def _is_bankable_task_name(task_name: str) -> bool:
    return task_name not in ["block_begin", "block_end"]


def _ensure_task_bank_lesson_exists(session, lesson_id: int | None) -> None:
    if lesson_id is None:
        return

    lesson_exists = session.scalars(select(Lesson.id).where(Lesson.id == lesson_id)).one_or_none()
    if lesson_exists is None:
        raise InvalidAPIUsage("Lesson not found", 404)


def sync_task_bank_items_from_assessments() -> None:
    with DBsession.begin() as session:
        existing_items = {(item.source_assessment_id, item.source_task_index): item
                          for item in session.scalars(
                              select(TaskBankItem).where(TaskBankItem.source_assessment_id != None).where(
                                  TaskBankItem.source_task_index != None)).all()}
        lesson_names_by_id = {lesson.id: lesson.name for lesson in session.scalars(select(Lesson)).all()}

        assessments = session.scalars(select(Assessment).order_by(Assessment.lesson_id).order_by(Assessment.id)).all()
        for assessment in assessments:
            tasks = json.loads(assessment.tasks or "[]")
            lesson_name = lesson_names_by_id.get(assessment.lesson_id, f"lesson_{assessment.lesson_id}")
            lesson_task_index = 0
            current_block_index: int | None = None
            next_block_index = 1
            for task_index, task in enumerate(tasks):
                task_name = str(task.get("name") or "task")

                if task_name == "block_begin":
                    current_block_index = next_block_index
                    next_block_index += 1
                    continue

                if task_name == "block_end":
                    current_block_index = None
                    continue

                if not _is_bankable_task_name(task_name):
                    continue

                lesson_task_index += 1
                source_key = (assessment.id, task_index)
                title = _task_title_from_source(lesson_name, task_name, lesson_task_index, current_block_index)
                task_json = json.dumps(task, ensure_ascii=False)
                existing_item = existing_items.get(source_key)

                if existing_item is None:
                    session.add(
                        TaskBankItem(title=title,
                                     task_name=task_name,
                                     task_json=task_json,
                                     lesson_id=assessment.lesson_id,
                                     source_assessment_id=assessment.id,
                                     source_task_index=task_index,
                                     source_block_index=current_block_index))
                    continue

                if existing_item.is_customized:
                    continue

                existing_item.title = title
                existing_item.task_name = task_name
                existing_item.task_json = task_json
                existing_item.lesson_id = assessment.lesson_id
                existing_item.source_block_index = current_block_index
                existing_item.updated_at = datetime.now()


def get_task_bank_items() -> list[TaskBankItem]:
    sync_task_bank_items_from_assessments()
    with DBsession.begin() as session:
        return session.scalars(
            select(TaskBankItem).where(TaskBankItem.is_hidden == False).outerjoin(TaskBankItem.lesson).order_by(
                TaskBankItem.lesson_id.is_(None)).order_by(Lesson.course_id).order_by(Lesson.number).order_by(
                    Lesson.id).order_by(TaskBankItem.source_block_index.is_(None)).order_by(
                        TaskBankItem.source_block_index).order_by(TaskBankItem.sort).order_by(
                            TaskBankItem.source_task_index).order_by(TaskBankItem.id)).all()


def get_task_bank_item_by_id(item_id: int) -> TaskBankItem | None:
    with DBsession.begin() as session:
        return session.scalars(select(TaskBankItem).where(TaskBankItem.id == item_id)).one_or_none()


def create_task_bank_item(data: TaskBankItemCreateReq) -> TaskBankItem:
    with DBsession.begin() as session:
        _ensure_task_bank_lesson_exists(session, data.lesson_id)
        task_json = json.dumps(data.task.model_dump(), ensure_ascii=False)
        item = TaskBankItem(title=data.title,
                            sort=data.sort,
                            task_name=data.task.name,
                            task_json=task_json,
                            lesson_id=data.lesson_id,
                            updated_at=datetime.now())
        session.add(item)
        session.flush()
        return item


def update_task_bank_item(item_id: int, data: TaskBankItemUpdateReq) -> TaskBankItem:
    with DBsession.begin() as session:
        item = session.scalars(select(TaskBankItem).where(TaskBankItem.id == item_id)).one_or_none()
        if item is None:
            raise InvalidAPIUsage("Task bank item not found", 404)

        _ensure_task_bank_lesson_exists(session, data.lesson_id)
        lesson_changed = item.lesson_id != data.lesson_id
        item.title = data.title
        item.sort = data.sort
        item.task_name = data.task.name
        item.task_json = json.dumps(data.task.model_dump(), ensure_ascii=False)
        item.lesson_id = data.lesson_id
        if lesson_changed:
            item.source_block_index = None
        item.is_customized = True
        item.updated_at = datetime.now()
        session.flush()
        return item


def delete_task_bank_item(item_id: int) -> None:
    with DBsession.begin() as session:
        item = session.scalars(select(TaskBankItem).where(TaskBankItem.id == item_id)).one_or_none()
        if item is None:
            raise InvalidAPIUsage("Task bank item not found", 404)

        linked_assignment_task = session.scalars(
            select(HomeworkAssignmentTask.id).where(HomeworkAssignmentTask.task_bank_item_id == item_id)).one_or_none()
        if linked_assignment_task is not None:
            raise InvalidAPIUsage("Task bank item is already used in assignments", 400)

        if item.source_assessment_id is not None and item.source_task_index is not None:
            item.is_hidden = True
            item.updated_at = datetime.now()
            session.flush()
            return

        session.delete(item)


def get_task_bank_completion_counts(student_id: int, task_bank_item_ids: list[int]) -> dict[int, int]:
    if len(task_bank_item_ids) == 0:
        return {}

    with DBsession.begin() as session:
        rows = session.execute(
            select(HomeworkAssignmentTask.task_bank_item_id, HomeworkTry.id).join(
                HomeworkAssignment, HomeworkAssignment.id == HomeworkAssignmentTask.assignment_id).join(
                    HomeworkAssignmentTarget, HomeworkAssignmentTarget.assignment_id == HomeworkAssignment.id).join(
                        HomeworkTry, HomeworkTry.target_id == HomeworkAssignmentTarget.id).where(
                            HomeworkAssignmentTask.task_bank_item_id.in_(task_bank_item_ids)).where(
                                HomeworkTry.student_id == student_id).where(HomeworkTry.end_datetime != None)).all()

        counts: dict[int, int] = {}
        for task_bank_item_id, _ in rows:
            if task_bank_item_id is None:
                continue
            counts[task_bank_item_id] = counts.get(task_bank_item_id, 0) + 1

        return counts


def get_students_by_ids(user_ids: list[int]) -> list[User]:
    if len(user_ids) == 0:
        return []

    with DBsession.begin() as session:
        return session.scalars(select(User).where(User.id.in_(user_ids)).where(User.level == User.Level.STUDENT)).all()


def create_homework_assignment(teacher_id: int, data: HomeworkAssignmentCreateReq) -> HomeworkAssignment:
    with DBsession.begin() as session:
        student_ids = list(dict.fromkeys(data.student_ids))
        valid_student_ids = set(
            session.scalars(select(User.id).where(
                User.id.in_(student_ids)).where(User.level == User.Level.STUDENT)).all())
        if len(valid_student_ids) == 0:
            raise InvalidAPIUsage("No valid students found for assignment", 400)

        if len(valid_student_ids) != len(student_ids):
            raise InvalidAPIUsage("Some selected students do not exist", 400)

        task_bank_item_ids = [task.task_bank_item_id for task in data.tasks if task.task_bank_item_id is not None]
        existing_bank_item_ids = set()
        if len(task_bank_item_ids) > 0:
            existing_bank_item_ids = set(
                session.scalars(select(TaskBankItem.id).where(TaskBankItem.id.in_(task_bank_item_ids))).all())
            if len(existing_bank_item_ids) != len(set(task_bank_item_ids)):
                raise InvalidAPIUsage("Some task bank items do not exist", 400)

        assignment = HomeworkAssignment(title=data.title, created_by_id=teacher_id)
        session.add(assignment)
        session.flush()

        for task in data.tasks:
            _ensure_task_bank_lesson_exists(session, task.lesson_id)
            if task.task_bank_item_id is not None and task.task_bank_item_id not in existing_bank_item_ids:
                raise InvalidAPIUsage("Task bank item not found", 404)

            session.add(
                HomeworkAssignmentTask(assignment_id=assignment.id,
                                       task_bank_item_id=task.task_bank_item_id,
                                       lesson_id=task.lesson_id,
                                       title=task.title,
                                       task_name=task.task.name,
                                       task_json=json.dumps(task.task.model_dump(), ensure_ascii=False),
                                       sort=task.sort))

        for student_id in student_ids:
            target = HomeworkAssignmentTarget(assignment_id=assignment.id,
                                              student_id=student_id,
                                              status=HomeworkAssignmentTarget.Status.PENDING)
            session.add(target)
            session.add(
                NotificationTeacherToStudent(student_id=student_id,
                                             homework_assignment_id=assignment.id,
                                             message=f"Вам выдано домашнее задание: {assignment.title}"))

        session.flush()
        return assignment


def get_homework_assignments_by_creator(teacher_id: int) -> list[HomeworkAssignment]:
    with DBsession.begin() as session:
        return session.scalars(
            select(HomeworkAssignment).where(HomeworkAssignment.created_by_id == teacher_id).order_by(
                HomeworkAssignment.created_at.desc()).order_by(HomeworkAssignment.id.desc())).all()


def get_homework_assignment_by_id(assignment_id: int) -> HomeworkAssignment | None:
    with DBsession.begin() as session:
        return session.scalars(select(HomeworkAssignment).where(HomeworkAssignment.id == assignment_id)).one_or_none()


def get_homework_assignment_tasks(assignment_id: int) -> list[HomeworkAssignmentTask]:
    with DBsession.begin() as session:
        return session.scalars(
            select(HomeworkAssignmentTask).where(HomeworkAssignmentTask.assignment_id == assignment_id).order_by(
                HomeworkAssignmentTask.sort).order_by(HomeworkAssignmentTask.id)).all()


def get_homework_assignment_targets(assignment_id: int) -> list[HomeworkAssignmentTarget]:
    with DBsession.begin() as session:
        return session.scalars(
            select(HomeworkAssignmentTarget).where(HomeworkAssignmentTarget.assignment_id == assignment_id).order_by(
                HomeworkAssignmentTarget.assigned_at.desc()).order_by(HomeworkAssignmentTarget.id.desc())).all()


def get_homework_assignment_target(assignment_id: int, student_id: int) -> HomeworkAssignmentTarget | None:
    with DBsession.begin() as session:
        return session.scalars(
            select(HomeworkAssignmentTarget).where(HomeworkAssignmentTarget.assignment_id == assignment_id).where(
                HomeworkAssignmentTarget.student_id == student_id)).one_or_none()


def get_homework_try_by_id(homework_try_id: int) -> HomeworkTry | None:
    with DBsession.begin() as session:
        return session.scalars(select(HomeworkTry).where(HomeworkTry.id == homework_try_id)).one_or_none()


def get_homework_tries_by_assignment(assignment_id: int) -> list[HomeworkTry]:
    with DBsession.begin() as session:
        return session.scalars(
            select(HomeworkTry).where(HomeworkTry.assignment_id == assignment_id).order_by(
                HomeworkTry.start_datetime.desc()).order_by(HomeworkTry.id.desc())).all()


def cancel_homework_assignment_target(teacher_id: int, target_id: int) -> HomeworkAssignmentTarget:
    with DBsession.begin() as session:
        target = session.scalars(
            select(HomeworkAssignmentTarget).join(
                HomeworkAssignment, HomeworkAssignment.id == HomeworkAssignmentTarget.assignment_id).where(
                    HomeworkAssignmentTarget.id == target_id).where(
                        HomeworkAssignment.created_by_id == teacher_id)).one_or_none()
        if target is None:
            raise InvalidAPIUsage("Assignment target not found", 404)
        if target.status == HomeworkAssignmentTarget.Status.COMPLETED:
            raise InvalidAPIUsage("Completed assignment cannot be cancelled", 400)

        target.status = HomeworkAssignmentTarget.Status.CANCELLED
        target.completed_at = None
        session.flush()
        return target


def _ensure_char(word_char_jp: str | None, word_jp: str) -> str:
    return word_char_jp if word_char_jp is not None and word_char_jp != "" else word_jp


def _collect_teacher_assignment_word_keys(session, subgroup_ids: list[int]) -> set[tuple[str, str, str]]:
    if len(subgroup_ids) == 0:
        return set()

    teacher_words = session.execute(
        select(QuizletSubgroupWord, QuizletDictionary).join(QuizletSubgroupWord.word).where(
            QuizletSubgroupWord.subgroup_id.in_(subgroup_ids))).all()

    result: set[tuple[str, str, str]] = set()
    for _, word in teacher_words:
        result.add((_ensure_char(word.char_jp, word.word_jp), word.word_jp, word.ru))
    return result


def _collect_personal_assignment_word_keys(session, subgroup_ids: list[int]) -> set[tuple[str, str, str]]:
    if len(subgroup_ids) == 0:
        return set()

    personal_words = session.scalars(select(UserQuizletWord).where(UserQuizletWord.subgroup_id.in_(subgroup_ids))).all()

    result: set[tuple[str, str, str]] = set()
    for word in personal_words:
        result.add((_ensure_char(word.char_jp, word.word_jp), word.word_jp, word.ru))
    return result


def get_quizlet_assignment_target_personal_subgroups(target_id: int) -> list[UserQuizletSubgroup]:
    with DBsession.begin() as session:
        return session.scalars(
            select(UserQuizletSubgroup).join(
                QuizletAssignmentTargetSubgroup,
                QuizletAssignmentTargetSubgroup.subgroup_id == UserQuizletSubgroup.id).where(
                    QuizletAssignmentTargetSubgroup.target_id == target_id).order_by(UserQuizletSubgroup.sort).order_by(
                        UserQuizletSubgroup.id)).all()


def create_quizlet_assignment(teacher_id: int, data: QuizletAssignmentCreateReq) -> QuizletAssignment:
    with DBsession.begin() as session:
        subgroup_ids = list(set(data.subgroup_ids))
        subgroups = session.scalars(select(QuizletSubgroup).where(QuizletSubgroup.id.in_(subgroup_ids))).all()
        if len(subgroups) != len(subgroup_ids):
            raise InvalidAPIUsage("Some selected dictionaries do not exist", 400)

        target_student_ids: set[int] = set(data.student_ids)
        target_student_ids = set(
            session.scalars(
                select(User.id).where(User.id.in_(target_student_ids)).where(User.level == User.Level.STUDENT)).all())

        if len(target_student_ids) == 0:
            raise InvalidAPIUsage("No valid students found for assignment", 400)

        personal_subgroup_ids_by_student: dict[int, list[int]] = {}
        for personal_target in data.personal_targets:
            if personal_target.student_id not in target_student_ids:
                raise InvalidAPIUsage("Personal dictionaries can be assigned only to selected students", 400)

            personal_subgroup_ids = list(set(personal_target.subgroup_ids))
            valid_personal_subgroup_ids = session.scalars(
                select(UserQuizletSubgroup.id).join(UserQuizletSubgroup.lesson).where(
                    UserQuizletSubgroup.id.in_(personal_subgroup_ids)).where(
                        UserQuizletLesson.user_id == personal_target.student_id)).all()
            if len(valid_personal_subgroup_ids) != len(personal_subgroup_ids):
                raise InvalidAPIUsage("Some selected personal dictionaries do not belong to the chosen student", 400)

            personal_subgroup_ids_by_student[personal_target.student_id] = personal_subgroup_ids

        teacher_word_keys = _collect_teacher_assignment_word_keys(session, subgroup_ids)
        max_words = 0

        for student_id in target_student_ids:
            assignment_word_keys = set(teacher_word_keys)
            assignment_word_keys.update(
                _collect_personal_assignment_word_keys(session, personal_subgroup_ids_by_student.get(student_id, [])))

            if len(assignment_word_keys) < 2:
                raise InvalidAPIUsage("At least 2 words are required for each selected student", 400)

            max_words = max(max_words, len(assignment_word_keys))

        assignment = QuizletAssignment(title=data.title,
                                       quiz_type=data.quiz_type,
                                       show_hints=data.show_hints,
                                       translation_direction=data.translation_direction,
                                       max_words=max_words,
                                       created_by_id=teacher_id)
        session.add(assignment)
        session.flush()

        for subgroup_id in subgroup_ids:
            session.add(QuizletAssignmentSubgroup(assignment_id=assignment.id, subgroup_id=subgroup_id))

        for student_id in target_student_ids:
            target = QuizletAssignmentTarget(assignment_id=assignment.id,
                                             student_id=student_id,
                                             status=QuizletAssignmentTarget.Status.PENDING)
            session.add(target)
            session.flush()

            for subgroup_id in personal_subgroup_ids_by_student.get(student_id, []):
                session.add(QuizletAssignmentTargetSubgroup(target_id=target.id, subgroup_id=subgroup_id))

            session.add(
                NotificationTeacherToStudent(student_id=student_id,
                                             quizlet_assignment_id=assignment.id,
                                             message=f"Вам выдано задание Quizlet: {assignment.title}"))

        return assignment


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


def add_assessment_notification(assessment_try_id: int, viewed: bool = False):
    with DBsession.begin() as session:
        session.add(NotificationTeacherToStudent(assessment_try_id=assessment_try_id, viewed=viewed))


def add_quizlet_personal_dictionary_notification(student_id: int, message: str):
    with DBsession.begin() as session:
        session.add(NotificationTeacherToStudent(student_id=student_id, message=message))


def mark_notifications_as_read(notification_ids: list[int]):
    with DBsession.begin() as session:
        session.execute(                                                                                                #
            update(NotificationStudentToTeacher)                                                                        #
            .where(NotificationStudentToTeacher.id.in_(notification_ids))                                               #
            .values(viewed=True)                                                                                        #
        )


# def get_notification_activity_try(
#         activity_try_type:
#             Literal["drilling_try"] |
#             Literal["hieroglyph_try"] |
#             Literal["assessment_try"] |
#             Literal["final_boss_try"],
#         activity_try_id: int):
