from datetime import datetime

from server.common import DBsession
from server.exceptions.ApiExceptions import (ActivityNotFoundException, CourseNotFoundException, InvalidAPIUsage,
                                             LessonNotFoundException)
from server.log_lib import LogI
from server.models.db_models import (ActivityTryType, ActivityType, Assessment, AssessmentTry, Course, Dictionary,
                                     Drilling, DrillingTry, Hieroglyph, HieroglyphTry, Lesson,
                                     NotificationStudentToTeacher, User, UserDictionary)


#########################################################################################################################
################ Course and Lesson ######################################################################################
#########################################################################################################################
def GetAvailableCourses(user_id: int) -> list[Course]:
    return DBsession().query(Course).join(Course.users).filter(User.id == user_id).order_by(Course.sort).all()


def GetCourseById(course_id: int, user_id: int) -> Course:
    course = (                                                                                                          #
        DBsession()                                                                                                     #
        .query(Course)                                                                                                  #
        .filter(Course.id == course_id)                                                                                 #
        .join(Course.users)                                                                                             #
        .filter(User.id == user_id)                                                                                     #
        .one_or_none()                                                                                                  #
    )                                                                                                                   #

    if course:
        return course

    if DBsession().query(Course).filter(Course.id == course_id).one_or_none():
        raise InvalidAPIUsage("You do not have access to this course!", 403)

    raise CourseNotFoundException()


def GetLessonsByCourseId(course_id: int, user_id: int) -> list[Lesson]:
    return (                                                                                                            #
        DBsession()                                                                                                     #
        .query(Lesson)                                                                                                  #
        .filter(Lesson.course_id == course_id)                                                                          #
        .join(Lesson.users)                                                                                             #
        .filter(User.id == user_id)                                                                                     #
        .order_by(Lesson.number)                                                                                        #
        .all()                                                                                                          #
    )                                                                                                                   #


def GetLessonById(lesson_id: int, user_id: int) -> Lesson:
    lesson = (                                                                                                          #
        DBsession()                                                                                                     #
        .query(Lesson)                                                                                                  #
        .filter(Lesson.id == lesson_id)                                                                                 #
        .join(Lesson.users)                                                                                             #
        .filter(User.id == user_id)                                                                                     #
        .one_or_none()                                                                                                  #
    )                                                                                                                   #

    if lesson:
        return lesson

    if lesson := DBsession().query(Lesson).filter(Lesson.id == lesson_id).one_or_none():
        raise InvalidAPIUsage("You do not have access to this lesson!", 403, {"course_id": lesson.course_id})

    raise LessonNotFoundException()


#########################################################################################################################
################ Activity ###############################################################################################
#########################################################################################################################
class ActivityQueries:
    _activity_type: ActivityType
    _activityTry_type: ActivityTryType

    def __init__(self, activity_type: ActivityType, activityTry_type: ActivityTryType):
        self._activity_type = activity_type
        self._activityTry_type = activityTry_type

    def GetByLessonId(self, lessonId: int, userId: int) -> ActivityType | None:
        return (                                                                                                        #
            DBsession()                                                                                                 #
            .query(self._activity_type)                                                                                 #
            .join(self._activity_type.lesson)                                                                           #
            .filter(Lesson.id == lessonId)                                                                              #
            .join(Lesson.users)                                                                                         #
            .filter(User.id == userId)                                                                                  #
            .one_or_none()                                                                                              #
        )                                                                                                               #

    def GetById(self, activityId: int, userId: int) -> ActivityType:
        activity = (                                                                                                    #
            DBsession()                                                                                                 #
            .query(self._activity_type)                                                                                 #
            .filter(self._activity_type.id == activityId)                                                               #
            .join(self._activity_type.lesson)                                                                           #
            .join(Lesson.users)                                                                                         #
            .filter(User.id == userId)                                                                                  #
            .one_or_none()                                                                                              #
        )                                                                                                               #

        if activity:
            return activity

        if activity := DBsession().query(
                self._activity_type).filter(self._activity_type.id == activityId).one_or_none():
            raise InvalidAPIUsage(f"You do not have access to this {self._activity_type.__name__}!", 403,
                                  {"lesson_id": activity.lesson_id})

        raise ActivityNotFoundException(self._activity_type.__name__)

    def GetTriesByActivityId(self, activityId: int, userId: int) -> list[ActivityTryType]:
        return (                                                                                                        #
            DBsession()                                                                                                 #
            .query(self._activityTry_type)                                                                              #
            .join(self._activityTry_type.base)                                                                          #
            .filter(self._activity_type.id == activityId)                                                               #
            .join(self._activity_type.lesson)                                                                           #
            .join(Lesson.users)                                                                                         #
            .filter(User.id == userId)                                                                                  #
            .order_by(self._activityTry_type.try_number)                                                                #
            .all()                                                                                                      #
        )

    def AddNewTry(self, tryNumber: int, activityId: int, userId: int) -> ActivityTryType | None:
        LogI(f"Add New Activity Try {self._activityTry_type.__name__}:", tryNumber, activityId, userId)
        newActivityTry = self._activityTry_type(try_number=tryNumber,
                                                start_datetime=datetime.now(),
                                                user_id=userId,
                                                base_id=activityId)
        DBsession().add(newActivityTry)
        DBsession().commit()
        return newActivityTry

    def GetUnfinishedTryByActivityId(self, activityId: int, userId: int) -> ActivityTryType:
        activityTry = (                                                                                                 #
            DBsession()                                                                                                 #
            .query(self._activityTry_type)                                                                              #
            .filter(self._activityTry_type.end_datetime == None)                                                        #
            .join(self._activityTry_type.base)                                                                          #
            .filter(self._activity_type.id == activityId)                                                               #
            .join(self._activity_type.lesson)                                                                           #
            .join(Lesson.users)                                                                                         #
            .filter(User.id == userId)                                                                                  #
            .one_or_none()                                                                                              #
        )

        if activityTry:
            return activityTry

        if activity := DBsession().query(
                self._activity_type).filter(self._activity_type.id == activityId).one_or_none():
            raise InvalidAPIUsage(f"{self._activity_type.__name__} not started!", 403,
                                  {"lesson_id": activity.lesson_id})

        raise ActivityNotFoundException(self._activity_type.__name__)


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################
class LexisQueries(ActivityQueries):
    def SetDoneTasksInTry(self, activityTryId: int, doneTasks: str) -> None:
        activityTry = (                                                                                                 #
            DBsession()                                                                                                 #
            .query(self._activityTry_type)                                                                              #
            .filter(self._activityTry_type.id == activityTryId)                                                         #
            .one_or_none()                                                                                              #
        )                                                                                                               #
        if activityTry:
            activityTry.done_tasks = doneTasks
            DBsession().add(activityTry)
            DBsession().commit()


#########################################################################################################################
################ Drilling and Hieroglyph ################################################################################
#########################################################################################################################
DrillingQueries = LexisQueries(Drilling, DrillingTry)
HieroglyphQueries = LexisQueries(Hieroglyph, HieroglyphTry)


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
class AssessmentQueriesClass(ActivityQueries):
    def AddNewTry(self,
                  tryNumber: int,
                  activityId: int,
                  userId: int,
                  tasks: str = "",
                  checked_tasks: str = "") -> ActivityTryType | None:
        LogI(f"Add New Activity Try {self._activityTry_type.__name__}:", tryNumber, activityId, userId)
        newActivityTry = self._activityTry_type(try_number=tryNumber,
                                                start_datetime=datetime.now(),
                                                user_id=userId,
                                                done_tasks=tasks,
                                                checked_tasks=checked_tasks,
                                                base_id=activityId)
        DBsession().add(newActivityTry)
        DBsession().commit()
        return newActivityTry


AssessmentQueries = AssessmentQueriesClass(Assessment, AssessmentTry)


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def get_dictionary(user_id: int) -> list[Dictionary]:
    return (                                                                                                            #
        DBsession.query(Dictionary, UserDictionary)                                                                     #
        .filter(Dictionary.id == UserDictionary.dictionary_id)                                                          #
        .filter(UserDictionary.user_id == user_id)                                                                      #
        .all()                                                                                                          #
    )


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
def get_notifications(user_id: int):
    return {"user": user_id}
    # ! return (                                                                                                            #
    # !   DBsession()                                                                                                     #
    # !   .query(NotificationStudentToTeacher)                                                                            #
    # !   .filter(NotificationStudentToTeacher.deleted == False)                                                          #
    # !   .order_by(NotificationStudentToTeacher.creation_datetime)                                                       #
    # !   .all()                                                                                                          #
    # ! )


def add_assessment_notification(assessment_try_id: int):
    DBsession().add(NotificationStudentToTeacher(assessment_try_id=assessment_try_id))
    DBsession().commit()


def add_drilling_notification(drilling_try_id: int):
    DBsession().add(NotificationStudentToTeacher(drilling_try_id=drilling_try_id))
    DBsession().commit()


def add_hieroglyph_notification(hieroglyph_try_id: int):
    DBsession().add(NotificationStudentToTeacher(hieroglyph_try_id=hieroglyph_try_id))
    DBsession().commit()
