from datetime import datetime
import json
from typing import Generic, Type, TypedDict

from sqlalchemy import Delete, Select, delete, select, update

from server.common import DBsession
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.models.assessment import AssessmentCreateReqStr
from server.models.course import CourseCreateReq
from server.models.db_models import (ActivityTryType, Assessment, AssessmentTry, AssessmentTryType, AssessmentType,
                                     Course, Dictionary, Drilling, DrillingCard, DrillingTry, FinalBoss, FinalBossTry,
                                     Hieroglyph, HieroglyphCard, HieroglyphTry, Lesson, LexisCardType, LexisTryType,
                                     LexisType, NotificationStudentToTeacher, NotificationTeacherToStudent,
                                     QuizletAssignment, QuizletAssignmentSubgroup, QuizletAssignmentTarget,
                                     QuizletAssignmentResult, QuizletDictionary, QuizletGroup, QuizletSubgroup,
                                     QuizletSubgroupWord, User, UserDictionary, a_users_courses, a_users_lessons)
from server.models.dictionary import (DictionaryCreateReq, DictionaryCreateReqItem)
from server.models.lesson import LessonCreateReq
from server.models.lexis import LexisCardCreateReq, LexisCreateReq
from server.models.quizlet import (QuizletGroupCreateReq, QuizletSubgroupCreateReq, QuizletWordCreateReq,
                                   QuizletAssignmentCreateReq, QuizletWordsBatchCreateReq, QuizletWordUpdateReq)


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
        return session.scalars(select(QuizletSubgroup).where(QuizletSubgroup.id.in_(subgroup_ids)).order_by(
            QuizletSubgroup.sort).order_by(QuizletSubgroup.id)).all()


def get_quizlet_assignment_targets(assignment_id: int) -> list[QuizletAssignmentTarget]:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletAssignmentTarget).where(QuizletAssignmentTarget.assignment_id == assignment_id)).all()


def get_quizlet_assignment_results(assignment_id: int) -> list[QuizletAssignmentResult]:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletAssignmentResult).where(QuizletAssignmentResult.assignment_id == assignment_id)).all()


def get_quizlet_assignment_result_by_id(result_id: int) -> QuizletAssignmentResult | None:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletAssignmentResult).where(QuizletAssignmentResult.id == result_id)).one_or_none()


def get_all_lessons_for_assignment() -> list[Lesson]:
    with DBsession.begin() as session:
        return session.scalars(select(Lesson).order_by(Lesson.course_id).order_by(Lesson.number).order_by(
            Lesson.id)).all()


def get_students_by_ids(user_ids: list[int]) -> list[User]:
    if len(user_ids) == 0:
        return []

    with DBsession.begin() as session:
        return session.scalars(select(User).where(User.id.in_(user_ids)).where(User.level == User.Level.STUDENT)).all()


def create_quizlet_assignment(teacher_id: int, data: QuizletAssignmentCreateReq) -> QuizletAssignment:
    with DBsession.begin() as session:
        subgroup_ids = list(set(data.subgroup_ids))
        subgroups = session.scalars(select(QuizletSubgroup).where(QuizletSubgroup.id.in_(subgroup_ids))).all()
        if len(subgroups) != len(subgroup_ids):
            raise InvalidAPIUsage("Some selected dictionaries do not exist", 400)

        target_student_ids: set[int] = set(data.student_ids)
        target_student_ids = set(
            session.scalars(select(User.id).where(User.id.in_(target_student_ids)).where(
                User.level == User.Level.STUDENT)).all())

        if len(target_student_ids) == 0:
            raise InvalidAPIUsage("No valid students found for assignment", 400)

        teacher_words = session.execute(
            select(QuizletSubgroupWord, QuizletDictionary).join(QuizletSubgroupWord.word).where(
                QuizletSubgroupWord.subgroup_id.in_(subgroup_ids))).all()
        unique_assignment_words: set[tuple[str, str, str]] = set()
        for _, word in teacher_words:
            ensured_char = word.char_jp if word.char_jp is not None and word.char_jp != "" else word.word_jp
            unique_assignment_words.add((ensured_char, word.word_jp, word.ru))

        if len(unique_assignment_words) < 2:
            raise InvalidAPIUsage("At least 2 words are required for assignment", 400)

        max_words = len(unique_assignment_words)
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
            session.add(
                NotificationTeacherToStudent(student_id=student_id,
                                             quizlet_assignment_id=assignment.id,
                                             message=f"Вам выдано задание Quizlet: {assignment.title}"))
            session.add(
                QuizletAssignmentTarget(assignment_id=assignment.id,
                                        student_id=student_id,
                                        status=QuizletAssignmentTarget.Status.PENDING))

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
