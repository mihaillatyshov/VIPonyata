import datetime
import json
from typing import Any, Optional, Type, TypeVar, Union

from sqlalchemy import (Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Table, Text, Time,
                        UniqueConstraint, create_engine)
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import Mapped, mapped_column, relationship, sessionmaker
from sqlalchemy.sql import func

from server.load_config import load_config
from server.models.dictionary import DictionaryItemDict

Base: Type = declarative_base()

USERS_ID = "users.id"
COURSES_ID = "courses.id"
LESSONS_ID = "lessons.id"

a_users_courses = Table("users_courses", Base.metadata, Column("id", Integer, primary_key=True),
                        Column("user_id", Integer, ForeignKey(USERS_ID), nullable=False),
                        Column("course_id", Integer, ForeignKey(COURSES_ID), nullable=False),
                        UniqueConstraint('user_id', 'course_id', name='idx_user_course'))

a_users_lessons = Table("users_lessons", Base.metadata, Column("id", Integer, primary_key=True),
                        Column("user_id", Integer, ForeignKey(USERS_ID), nullable=False),
                        Column("lesson_id", Integer, ForeignKey(LESSONS_ID), nullable=False),
                        UniqueConstraint('user_id', 'lesson_id', name='idx_user_lesson'))


#########################################################################################################################
################ User ###################################################################################################
#########################################################################################################################
class User(Base):
    class Level:
        STUDENT = 0
        TEACHER = 1

    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    nickname: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    password: Mapped[str] = mapped_column(String(512), nullable=False)
    birthday: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    theme: Mapped[Optional[str]] = mapped_column(String(128))
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    avatar: Mapped[Optional[str]] = mapped_column(String(1024))
    form: Mapped[Optional[str]] = mapped_column(Text)

    registration_date: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)   # pylint: disable=not-callable

    courses: Mapped[list["Course"]] = relationship("Course", secondary=a_users_courses, overlaps="courses,user")
    lessons: Mapped[list["Lesson"]] = relationship("Lesson", secondary=a_users_lessons, overlaps="lessons,user")

    users_dictionary: Mapped[list["UserDictionary"]] = relationship("UserDictionary", back_populates="user")

    __mapper_args__ = {'eager_defaults': True}

    def __json__(self):
        return {
            "id": self.id,
            "name": self.name,
            "nickname": self.nickname,
            "birthday": self.birthday,
            "theme": self.theme,
            "level": self.level,
            "avatar": self.avatar,
            "form": self.form,
        }

    def __repr__(self):
        return f"<User: (id={self.id}, nickname={self.nickname}, level={self.level})>"


#########################################################################################################################
################ Course #################################################################################################
#########################################################################################################################
class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(128), nullable=False)
    difficulty_color: Mapped[Optional[str]] = mapped_column(String(64))
    sort: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(2048))
    img: Mapped[Optional[str]] = mapped_column(String(1024))

    creation_datetime: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)   # pylint: disable=not-callable

    users: Mapped[list["User"]] = relationship("User", secondary=a_users_courses, overlaps="courses,user")
    lessons: Mapped[list["Lesson"]] = relationship("Lesson", back_populates="course")

    __mapper_args__ = {'eager_defaults': True}

    def __json__(self):
        data = {}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)

        return data

    def __repr__(self):
        return f"<Course: (id={self.id}, name={self.name})>"


#########################################################################################################################
################ Lesson #################################################################################################
#########################################################################################################################
class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(2048))
    img: Mapped[Optional[str]] = mapped_column(String(1024))

    creation_datetime: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)   # pylint: disable=not-callable

    users: Mapped[list["User"]] = relationship("User", secondary=a_users_lessons, overlaps="lessons,user")

    course_id: Mapped[int] = mapped_column(Integer, ForeignKey(COURSES_ID), nullable=False)
    course: Mapped["Course"] = relationship("Course", back_populates="lessons", uselist=False)

    drilling: Mapped[Optional["Drilling"]] = relationship("Drilling", uselist=False)
    hieroglyph: Mapped[Optional["Hieroglyph"]] = relationship("Hieroglyph", uselist=False)

    assessment: Mapped[Optional["Assessment"]] = relationship("Assessment", uselist=False)
    final_boss: Mapped[Optional["FinalBoss"]] = relationship("FinalBoss", uselist=False)

    __mapper_args__ = {'eager_defaults': True}

    def __json__(self):
        data = {}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data

    def __repr__(self):
        return f"<Lesson: (id={self.id}, name={self.name})>"


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
class Dictionary(Base):
    __tablename__ = "dictionary"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    char_jp: Mapped[Optional[str]] = mapped_column(String(128))
    word_jp: Mapped[Optional[str]] = mapped_column(String(128))
    ru: Mapped[str] = mapped_column(String(128), nullable=False)
    img: Mapped[Optional[str]] = mapped_column(String(1024))

    users_dictionary: Mapped[list["UserDictionary"]] = relationship("UserDictionary", back_populates="dictionary")

    def __json__(self):
        data = {}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data

    def __repr__(self):
        return f"<Dictionary: (id={self.id}, char_jp={self.char_jp}, word_jp={self.char_jp}, ru={self.ru})>"


class UserDictionary(Base):
    __tablename__ = "users_dictionary"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    img: Mapped[Optional[str]] = mapped_column(String(1024))
    association: Mapped[Optional[str]] = mapped_column(String(1024))

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey(USERS_ID), nullable=False)
    user: Mapped[list["User"]] = relationship("User", back_populates="users_dictionary")

    dictionary_id: Mapped[int] = mapped_column(Integer, ForeignKey("dictionary.id"), nullable=False)
    dictionary: Mapped[list["Dictionary"]] = relationship("Dictionary", back_populates="users_dictionary")

    __table_args__ = (UniqueConstraint('user_id', 'dictionary_id', name='idx_user_dictionary'), )

    def __json__(self):
        data = {}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data


#########################################################################################################################
################ Activity ###############################################################################################
#########################################################################################################################
class AbstractActivity(Base):
    __abstract__ = True
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    description: Mapped[Optional[str]] = mapped_column(String(2048))

    time_limit: Mapped[Optional[datetime.time]] = mapped_column(Time)

    @declared_attr
    @classmethod
    def lesson_id(cls) -> Mapped[int]:
        return mapped_column(Integer, ForeignKey(LESSONS_ID), nullable=False)

    # @NoSelf
    @declared_attr
    @classmethod
    def lesson(cls) -> Mapped["Lesson"]:
        return relationship("Lesson", overlaps="drilling,hieroglyph,assessment,final_boss")

    tries: list = []                                                                                                    # TODO : fix type
    now_try: Any | None = None                                                                                          # TODO : fix type

    def calc_deadline(self) -> datetime.datetime | None:
        if not self.time_limit:
            return None

        if self.now_try:
            return self.now_try.start_datetime + time_limit_to_timedelta(self.time_limit)
        if self.tries and not self.tries[-1].end_datetime:
            return self.tries[-1].start_datetime + time_limit_to_timedelta(self.time_limit)

        return None

    def __json__(self):
        data = {"tries": self.tries, "deadline": self.calc_deadline(), "try": self.now_try}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data


class AbstractActivityTry(Base):
    __abstract__ = True

    def __init__(self, *args, **kwargs):                                                                                # pylint: disable=useless-parent-delegation
        super().__init__(*args, **kwargs)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    try_number: Mapped[int] = mapped_column(Integer, nullable=False)
    start_datetime: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    end_datetime: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)

    @declared_attr
    @classmethod
    def user_id(cls) -> Mapped[int]:
        return mapped_column(Integer, ForeignKey(USERS_ID), nullable=False)

    @declared_attr
    @classmethod
    def user(cls) -> Mapped[list["User"]]:
        return relationship("User")

    base_id: Mapped[int]
    base: Mapped[Union["Drilling", "Hieroglyph", "Assessment", "FinalBoss"]]

    def __json__(self):
        data = {}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################
class AbstractLexis(AbstractActivity):
    __abstract__ = True

    def __init__(self, *args, **kwargs):                                                                                # pylint: disable=useless-parent-delegation
        super().__init__(*args, **kwargs)

    tasks: Mapped[str] = mapped_column(String(2048), nullable=False)

    cards: Mapped[list["AbstractLexisCard"]]

    def get_tasks_names(self):
        return self.tasks.split(",")


class AbstractLexisCard(Base):
    __abstract__ = True

    def __init__(self, *args, **kwargs):                                                                                # pylint: disable=useless-parent-delegation
        super().__init__(*args, **kwargs)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    sentence: Mapped[str] = mapped_column(String(256), nullable=False)
    answer: Mapped[str] = mapped_column(String(256), nullable=False)

    @declared_attr
    @classmethod
    def dictionary_id(cls) -> Mapped[int]:
        return mapped_column(Integer, ForeignKey("dictionary.id"), nullable=False)

    @declared_attr
    @classmethod
    def dictionary(cls) -> Mapped["Dictionary"]:
        return relationship("Dictionary")

    base_id: Mapped[int]
    base: Mapped[Union["Drilling", "Hieroglyph", "Assessment", "FinalBoss"]]

    word: Optional[DictionaryItemDict] = None

    def __json__(self):
        data = {"word": self.word}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data


class AbstractLexisTry(AbstractActivityTry):
    __abstract__ = True
    done_tasks: Mapped[str] = mapped_column(String(2048))

    def get_done_tasks_dict(self) -> dict:
        res = {}
        if self.done_tasks:
            for task in self.done_tasks.split(","):
                key, val = task.split(":")
                res[key] = val
        return res

    base: Mapped[Union["Drilling", "Hieroglyph"]]

    def __json__(self):
        data = super().__json__()
        data["done_tasks"] = self.get_done_tasks_dict()
        return data


#########################################################################################################################
################ Drilling ###############################################################################################
#########################################################################################################################
class Drilling(AbstractLexis):
    __tablename__ = "drillings"

    cards: Mapped[list["DrillingCard"]] = relationship("DrillingCard")


class DrillingTry(AbstractLexisTry):
    __tablename__ = "drilling_tries"

    base_id: Mapped[int] = mapped_column(Integer, ForeignKey("drillings.id"), nullable=False)
    base: Mapped["Drilling"] = relationship("Drilling", uselist=False)


class DrillingCard(AbstractLexisCard):
    __tablename__ = "drilling_cards"

    base_id: Mapped[int] = mapped_column(Integer, ForeignKey("drillings.id"), nullable=False)
    base: Mapped["Drilling"] = relationship("Drilling", back_populates="cards", uselist=False)


#########################################################################################################################
################ Hieroglyph #############################################################################################
#########################################################################################################################
class Hieroglyph(AbstractLexis):
    __tablename__ = "hieroglyphs"

    cards: Mapped[list["HieroglyphCard"]] = relationship("HieroglyphCard")


class HieroglyphTry(AbstractLexisTry):
    __tablename__ = "hieroglyph_tries"

    base_id: Mapped[int] = mapped_column(Integer, ForeignKey("hieroglyphs.id"), nullable=False)
    base: Mapped["Hieroglyph"] = relationship("Hieroglyph", uselist=False)


class HieroglyphCard(AbstractLexisCard):
    __tablename__ = "hieroglyph_cards"

    base_id: Mapped[int] = mapped_column(Integer, ForeignKey("hieroglyphs.id"), nullable=False)
    base: Mapped["Hieroglyph"] = relationship("Hieroglyph", back_populates="cards", uselist=False)


#########################################################################################################################
################ AbstractAssessment #####################################################################################
#########################################################################################################################
class AbstractAssessment(AbstractActivity):
    __abstract__ = True

    def __init__(self, *args, **kwargs):                                                                                # pylint: disable=useless-parent-delegation
        super().__init__(*args, **kwargs)

    tasks: Mapped[str] = mapped_column(Text, nullable=False)

    def __json__(self):
        data = super().__json__()
        del data["tasks"]
        return data


class AbstractAssessmentTry(AbstractActivityTry):
    __abstract__ = True

    done_tasks: Mapped[str] = mapped_column(Text, nullable=False)
    checked_tasks: Mapped[Optional[str]] = mapped_column(Text)                                                          # TODO : check type

    base: Mapped[Union["Assessment", "FinalBoss"]]

    def __json__(self):
        data = super().__json__()
        data["done_tasks"] = json.loads(self.done_tasks)
        data["checked_tasks"] = json.loads(self.checked_tasks)
        return data


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
class Assessment(AbstractAssessment):
    __tablename__ = "assessments"


class AssessmentTry(AbstractAssessmentTry):
    __tablename__ = "assessment_tries"

    base_id: Mapped[int] = mapped_column(Integer, ForeignKey("assessments.id"), nullable=False)
    base: Mapped["Assessment"] = relationship("Assessment", uselist=False)


#########################################################################################################################
################ FinalBoss ##############################################################################################
#########################################################################################################################
class FinalBoss(AbstractAssessment):
    __tablename__ = "final_bosses"


class FinalBossTry(AbstractAssessmentTry):
    __tablename__ = "final_boss_tries"

    base_id: Mapped[int] = mapped_column(Integer, ForeignKey("final_bosses.id"), nullable=False)
    base: Mapped["FinalBoss"] = relationship("FinalBoss", uselist=False)


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
class NotificationStudentToTeacher(Base):
    __tablename__ = "notifications_student_to_teacher"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    message: Mapped[str] = mapped_column(Text)

    viewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    drilling_try_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("drilling_tries.id"))
    drilling_try: Mapped["DrillingTry"] = relationship("DrillingTry", uselist=False)

    hieroglyph_try_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("hieroglyph_tries.id"))
    hieroglyph_try: Mapped["HieroglyphTry"] = relationship("HieroglyphTry", uselist=False)

    assessment_try_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("assessment_tries.id"))
    assessment_try: Mapped["AssessmentTry"] = relationship("AssessmentTry", uselist=False)

    final_boss_try_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("final_boss_tries.id"))
    final_boss_try: Mapped["FinalBossTry"] = relationship("FinalBossTry", uselist=False)

    creation_datetime: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)   # pylint: disable=not-callable

    __mapper_args__ = {'eager_defaults': True}

    def __json__(self):
        data = {
            "id": self.id,
            "message": self.message,
            "type": None,
            "creation_datetime": self.creation_datetime,
            "viewed": self.viewed,
            "deleted": self.deleted
        }
        for activity_try_name in ["drilling_try", "hieroglyph_try", "assessment_try", "final_boss_try"]:
            if activity_try_id := getattr(self, f"{activity_try_name}_id"):
                data["type"] = activity_try_name
                data["activity_try_id"] = activity_try_id

                break

        return data


class NotificationTeacherToStudent(Base):
    __tablename__ = "notifications_teacher_to_student"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    message: Mapped[str] = mapped_column(Text)

    viewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    course_id: Mapped[int] = mapped_column(Integer, ForeignKey(COURSES_ID))
    course: Mapped["Course"] = relationship("Course", uselist=False)

    lesson_id: Mapped[int] = mapped_column(Integer, ForeignKey(LESSONS_ID))
    lesson: Mapped["Lesson"] = relationship("Lesson", uselist=False)

    assessment_try_id: Mapped[int] = mapped_column(Integer, ForeignKey("assessment_tries.id"))
    assessment_try: Mapped["AssessmentTry"] = relationship("AssessmentTry", uselist=False)

    final_boss_try_id: Mapped[int] = mapped_column(Integer, ForeignKey("final_boss_tries.id"))
    final_boss_try: Mapped["FinalBossTry"] = relationship("FinalBossTry", uselist=False)

    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    student: Mapped["User"] = relationship("User", uselist=False)

    creation_datetime: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)   # pylint: disable=not-callable

    __mapper_args__ = {'eager_defaults': True}

    def __json__(self):
        data = {
            "id": self.id,
            "message": self.message,
            "type": None,
            "creation_datetime": self.creation_datetime,
            "viewed": self.viewed,
            "deleted": self.deleted
        }
        for activity_try_name in ["assessment_try", "final_boss_try"]:
            if activity_try_id := getattr(self, f"{activity_try_name}_id"):
                data["type"] = activity_try_name
                data["activity_try_id"] = activity_try_id
                break

        if self.course_id is not None:
            data["type"] = "course"
            data["course_id"] = self.course_id

        if self.lesson_id is not None:
            data["type"] = "lesson"
            data["lesson_id"] = self.lesson_id

        return data


#########################################################################################################################
################ Utils ##################################################################################################
#########################################################################################################################
def time_limit_to_timedelta(time_limit: datetime.time) -> datetime.timedelta:
    return datetime.timedelta(hours=time_limit.hour,
                              minutes=time_limit.minute,
                              seconds=time_limit.second,
                              microseconds=time_limit.microsecond)


LexisType = TypeVar("LexisType", bound=AbstractLexis)                                                                   # pylint: disable=invalid-name
LexisTryType = TypeVar("LexisTryType", bound=AbstractLexisTry)                                                          # pylint: disable=invalid-name
LexisCardType = TypeVar("LexisCardType", bound=AbstractLexisCard)                                                       # pylint: disable=invalid-name

AssessmentType = TypeVar("AssessmentType", bound=AbstractAssessment)                                                    # pylint: disable=invalid-name
AssessmentTryType = TypeVar("AssessmentTryType", bound=AbstractAssessmentTry)                                           # pylint: disable=invalid-name

ActivityType = TypeVar("ActivityType", bound=AbstractActivity)                                                          # pylint: disable=invalid-name
ActivityTryType = TypeVar("ActivityTryType", bound=AbstractActivityTry)                                                 # pylint: disable=invalid-name


def create_db_engine(db_config: URL):
    return create_engine(db_config,
                         pool_recycle=3600,
                         pool_size=20,
                         max_overflow=30,
                         pool_timeout=5,
                         pool_pre_ping=True)


def create_db_session(url, username, password, host, database):
    db_config = URL.create(
        url,
        username=username,
        password=password,
        host=host,
        database=database,
    )

    engine = create_db_engine(db_config)

    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    print("session created succesfully")
    return session_factory


def create_db_session_from_json_config_file():
    config = load_config("config.json")["db"]
    return create_db_session(config["url"], config["username"], config["password"], config["host"], config["database"])


def get_db_url_from_json_config_file():
    config = load_config("config.json")["db"]
    return f"{config['url']}://{config['username']}:{config['password']}@{config['host']}/{config['database']}"
