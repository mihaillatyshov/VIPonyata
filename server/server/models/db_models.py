import datetime
from typing import Any, Type, TypeVar

from sqlalchemy import (Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Table, Text, Time,
                        UniqueConstraint, create_engine)
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import Mapped, relationship, sessionmaker
from sqlalchemy.sql import func

from server.load_config import load_config

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
    id = Column(Integer, primary_key=True)

    name = Column(String(128), nullable=False)
    nickname = Column(String(128), nullable=False, unique=True)
    password = Column(String(512), nullable=False)
    birthday = Column(Date, nullable=False)
    theme = Column(String(128))
    level = Column(Integer, nullable=False)
    avatar = Column(String(1024))
    form = Column(Text)

    registration_date = Column(DateTime, default=func.now())

    courses: list["Course"] = relationship("Course", secondary=a_users_courses, overlaps="courses,user")
    lessons: list["Lesson"] = relationship("Lesson", secondary=a_users_lessons, overlaps="lessons,user")

    users_dictionary: list["UserDictionary"] = relationship("UserDictionary", back_populates="user")

    def __repr__(self):
        return f"<User: (id={self.id}, nickname={self.nickname}, level={self.level})>"


#########################################################################################################################
################ Course #################################################################################################
#########################################################################################################################
class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True)

    name = Column(String(128), nullable=False)
    difficulty = Column(String(128), nullable=False)
    difficulty_color = Column(String(64))
    sort = Column(Integer, default=500, nullable=False)
    description = Column(String(2048))
    img = Column(String(1024))

    creation_datetime = Column(DateTime, default=func.now())

    users: list["User"] = relationship("User", secondary=a_users_courses, overlaps="courses,user")

    lessons: list["Lesson"] = relationship("Lesson", back_populates="course")

    def __repr__(self):
        return f"<Course: (id={self.id}, name={self.name})>"


#########################################################################################################################
################ Lesson #################################################################################################
#########################################################################################################################
class Lesson(Base):
    __tablename__ = "lessons"
    id: int = Column(Integer, primary_key=True)

    name = Column(String(128), nullable=False)
    number = Column(Integer, nullable=False)
    description = Column(String(2048))
    img = Column(String(1024))

    creation_datetime = Column(DateTime, default=func.now())

    users: list["User"] = relationship("User", secondary=a_users_lessons, overlaps="lessons,user")

    course_id = Column(Integer, ForeignKey(COURSES_ID), nullable=False)
    course: "Course" = relationship("Course", back_populates="lessons", uselist=False)

    drilling: "Drilling" = relationship("Drilling", uselist=False)
    hieroglyph: "Hieroglyph" = relationship("Hieroglyph", uselist=False)

    assessment: "Assessment" = relationship("Assessment", uselist=False)
    final_boss: "FinalBoss" = relationship("FinalBoss", uselist=False)

    def __repr__(self):
        return f"<Lesson: (id={self.id}, name={self.name})>"


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
class Dictionary(Base):
    __tablename__ = "dictionary"
    id = Column(Integer, primary_key=True)

    char_jp = Column(String(128))
    word_jp = Column(String(128))
    ru = Column(String(128), nullable=False)
    img = Column(String(1024))

    users_dictionary: list["UserDictionary"] = relationship("UserDictionary", back_populates="dictionary")

    def __json__(self):
        data = {}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data

    def __repr__(self):
        return f"<Dictionary: (id={self.id}, char_jp={self.char_jp}, word_jp={self.char_jp}, ru={self.ru})>"


class UserDictionary(Base):
    __tablename__ = "users_dictionary"

    id = Column(Integer, primary_key=True)

    img = Column(String(1024))
    association = Column(String(1024))

    user_id = Column(Integer, ForeignKey(USERS_ID), nullable=False)
    user: list["User"] = relationship("User", back_populates="users_dictionary")

    dictionary_id = Column(Integer, ForeignKey("dictionary.id"), nullable=False)
    dictionary: list["Dictionary"] = relationship("Dictionary", back_populates="users_dictionary")

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
    id: int = Column(Integer, primary_key=True)

    description = Column(String(2048))

    time_limit: datetime.time | None = Column(Time)

    @declared_attr
    def lesson_id(cls) -> Column[Integer]:
        return Column(Integer, ForeignKey(LESSONS_ID), nullable=False)

    @declared_attr                                                                                                      # type: ignore
    def lesson(cls):
        return relationship("Lesson", overlaps="drilling,hieroglyph,assessment,final_boss")

    tries: list = []
    now_try: Any | None = None

    def calcDeadline(self) -> datetime.datetime | None:
        if not self.time_limit:
            return None

        if self.now_try:
            return self.now_try.start_datetime + time_limit_to_timedelta(self.time_limit)
        if self.tries and not self.tries[-1].end_datetime:
            return self.tries[-1].start_datetime + time_limit_to_timedelta(self.time_limit)

        return None

    def __json__(self):
        data = {"tries": self.tries, "deadline": self.calcDeadline(), "try": self.now_try}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data


class AbstractActivityTry(Base):
    __abstract__ = True
    id: int = Column(Integer, primary_key=True)

    try_number = Column(Integer, nullable=False)
    start_datetime: Mapped[datetime.datetime] = Column(DateTime, nullable=False)
    end_datetime: Mapped[datetime.datetime] = Column(DateTime)

    @declared_attr                                                                                                      # type: ignore
    def user_id(cls) -> Mapped[int]:
        return Column(Integer, ForeignKey(USERS_ID), nullable=False)

    @declared_attr                                                                                                      # type: ignore
    def user(cls) -> Mapped[list["User"]]:
        return relationship("User")

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
    tasks = Column(String(2048), nullable=False)

    def getTasksNames(self):
        return self.tasks.split(",")

    def get_card_words(self):
        words_ru = []
        words_jp = []
        chars_jp = []
        for card in self.cards:
            words_ru.append(card.dictionary.ru)
            words_jp.append(card.dictionary.word_jp)
            chars_jp.append(card.dictionary.char_jp)

        return words_ru, words_jp, chars_jp


class AbstractLexisCard(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True)

    sentence = Column(String(256), nullable=False)
    answer = Column(String(256), nullable=False)

    @declared_attr                                                                                                      # type: ignore
    def dictionary_id(cls) -> Mapped[int]:
        return Column(Integer, ForeignKey("dictionary.id"), nullable=False)

    @declared_attr                                                                                                      # type: ignore
    def dictionary(cls):
        return relationship("Dictionary")

    def __json__(self):
        data = {"word": self.dictionary}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data


class AbstractLexisTry(AbstractActivityTry):
    __abstract__ = True
    done_tasks = Column(String(2048))

    def getDoneTasksDict(self) -> dict:
        res = {}
        if self.done_tasks:
            for task in self.done_tasks.split(","):
                key, val = task.split(":")
                res[key] = val
        return res

    def __json__(self):
        data = super().__json__()
        data["done_tasks"] = self.getDoneTasksDict()
        return data


#########################################################################################################################
################ Drilling ###############################################################################################
#########################################################################################################################
class Drilling(AbstractLexis):
    __tablename__ = "drillings"

    cards: list["DrillingCard"] = relationship("DrillingCard")


class DrillingCard(AbstractLexisCard):
    __tablename__ = "drilling_cards"

    base_id = Column(Integer, ForeignKey("drillings.id"), nullable=False)
    base: "Drilling" = relationship("Drilling", back_populates="cards", uselist=False)


class DrillingTry(AbstractLexisTry):
    __tablename__ = "drilling_tries"

    base_id = Column(Integer, ForeignKey("drillings.id"), nullable=False)
    base: "Drilling" = relationship("Drilling", uselist=False)


#########################################################################################################################
################ Hieroglyph #############################################################################################
#########################################################################################################################
class Hieroglyph(AbstractLexis):
    __tablename__ = "hieroglyphs"

    cards: list["HieroglyphCard"] = relationship("HieroglyphCard")


class HieroglyphCard(AbstractLexisCard):
    __tablename__ = "hieroglyph_cards"

    base_id = Column(Integer, ForeignKey("hieroglyphs.id"), nullable=False)
    base: "Hieroglyph" = relationship("Hieroglyph", back_populates="cards", uselist=False)


class HieroglyphTry(AbstractLexisTry):
    __tablename__ = "hieroglyph_tries"

    base_id = Column(Integer, ForeignKey("hieroglyphs.id"), nullable=False)
    base: "Hieroglyph" = relationship("Hieroglyph", uselist=False)


#########################################################################################################################
################ AbstractAssessment #####################################################################################
#########################################################################################################################
class AbstractAssessment(AbstractActivity):
    __abstract__ = True

    tasks: str = Column(Text, nullable=False)

    def __json__(self):
        data = super().__json__()
        del data["tasks"]
        return data


class AbstractAssessmentTry(AbstractActivityTry):
    __abstract__ = True

    done_tasks: str = Column(Text, nullable=False)
    checked_tasks = Column(Text)


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
class Assessment(AbstractAssessment):
    __tablename__ = "assessments"


class AssessmentTry(AbstractAssessmentTry):
    __tablename__ = "assessment_tries"

    base_id = Column(Integer, ForeignKey("assessments.id"))
    base: "Assessment" = relationship("Assessment", uselist=False)


#########################################################################################################################
################ FinalBoss ##############################################################################################
#########################################################################################################################
class FinalBoss(AbstractAssessment):
    __tablename__ = "final_bosses"


class FinalBossTry(AbstractAssessmentTry):
    __tablename__ = "final_boss_tries"

    base_id = Column(Integer, ForeignKey("final_bosses.id"))
    base: "FinalBoss" = relationship("FinalBoss", uselist=False)


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
class NotificationStudentToTeacher(Base):
    __tablename__ = "notifications_student_to_teacher"
    id = Column(Integer, primary_key=True)

    message = Column(Text)

    viewed = Column(Boolean, nullable=False, default=False)
    deleted = Column(Boolean, nullable=False, default=False)

    drilling_try_id = Column(Integer, ForeignKey("drilling_tries.id"))
    drilling_try: "DrillingTry" = relationship("DrillingTry", uselist=False)

    hieroglyph_try_id = Column(Integer, ForeignKey("hieroglyph_tries.id"))
    hieroglyph_try: "HieroglyphTry" = relationship("HieroglyphTry", uselist=False)

    assessment_try_id = Column(Integer, ForeignKey("assessment_tries.id"))
    assessment_try: "AssessmentTry" = relationship("AssessmentTry", uselist=False)

    final_boss_try_id = Column(Integer, ForeignKey("final_boss_tries.id"))
    final_boss_try: "FinalBossTry" = relationship("FinalBossTry", uselist=False)

    creation_datetime = Column(DateTime, default=func.now())

    def __json__(self):
        data = {"message": self.message, "type": None}
        for activity_try_name in ["drilling_try", "hieroglyph_try", "assessment_try", "final_boss_try"]:
            if activity_try := getattr(self, activity_try_name):
                data["type"] = activity_try_name
                data["lesson"] = activity_try.base.lesson
                data["user"] = activity_try.user
                data["activity_try_id"] = activity_try.id
                data["activity_try"] = activity_try
                data["activity"] = activity_try.base
                break

        return data


class NotificationTeacherToStudent(Base):
    __tablename__ = "notifications_teacher_to_student"
    id = Column(Integer, primary_key=True)

    message = Column(Text)

    viewed = Column(Boolean, nullable=False, default=False)
    deleted = Column(Boolean, nullable=False, default=False)

    course_id = Column(Integer, ForeignKey(COURSES_ID))
    course: "Course" = relationship("Course", uselist=False)

    lesson_id = Column(Integer, ForeignKey(LESSONS_ID))
    lesson: "Lesson" = relationship("Lesson", uselist=False)

    assessment_try_id = Column(Integer, ForeignKey("assessment_tries.id"))
    assessment_try: "AssessmentTry" = relationship("AssessmentTry", uselist=False)

    final_boss_try_id = Column(Integer, ForeignKey("final_boss_tries.id"))
    final_boss_try: "FinalBossTry" = relationship("FinalBossTry", uselist=False)

    creation_datetime = Column(DateTime, default=func.now())

    def __json__(self):
        data = {"message": self.message, "type": None}
        for activity_try_name in ["assessment_try", "final_boss_try"]:
            if activity_try := getattr(self, activity_try_name):
                data["type"] = activity_try_name
                data["lesson"] = activity_try.base.lesson
                data["user"] = activity_try.user
                data["activity_try_id"] = activity_try.id
                data["activity_try"] = activity_try
                data["activity"] = activity_try.base
                break

        if self.course is not None:
            data["type"] = "course"
            data["course"] = self.course

        if self.lesson is not None:
            data["type"] = "lesson"
            data["lesson"] = self.lesson

        return data


#########################################################################################################################
################ Utils ##################################################################################################
#########################################################################################################################
def time_limit_to_timedelta(time_limit: datetime.time) -> datetime.timedelta:
    return datetime.timedelta(hours=time_limit.hour,
                              minutes=time_limit.minute,
                              seconds=time_limit.second,
                              microseconds=time_limit.microsecond)


ActivityType = TypeVar("ActivityType", Drilling, Hieroglyph, Assessment, FinalBoss)
ActivityTryType = TypeVar("ActivityTryType", DrillingTry, HieroglyphTry, AssessmentTry, FinalBossTry)

GenericActivityType = TypeVar("GenericActivityType", Type[Drilling], Type[Hieroglyph], Type[Assessment],
                              Type[FinalBoss])
GenericActivityTryType = TypeVar("GenericActivityTryType", Type[DrillingTry], Type[HieroglyphTry], Type[AssessmentTry],
                                 Type[FinalBossTry])

LexisType = TypeVar("LexisType", Drilling, Hieroglyph)
LexisCardType = TypeVar("LexisCardType", DrillingCard, HieroglyphCard)
LexisTryType = TypeVar("LexisTryType", DrillingTry, HieroglyphTry)

GenericLexisType = TypeVar("GenericLexisType", Type[Drilling], Type[Hieroglyph])
GenericLexisCardType = TypeVar("GenericLexisCardType", Type[DrillingCard], Type[HieroglyphCard])
GenericLexisTryType = TypeVar("GenericLexisTryType", Type[DrillingTry], Type[HieroglyphTry])

AssessmentType = TypeVar("AssessmentType", Assessment, FinalBoss)
AssessmentTryType = TypeVar("AssessmentTryType", AssessmentTry, FinalBossTry)

GenericAssessmentType = TypeVar("GenericAssessmentType", Type[Assessment], Type[FinalBoss])
GenericAssessmentTryType = TypeVar("GenericAssessmentTryType", Type[AssessmentTry], Type[FinalBossTry])


def create_db_session(url, username, password, host, database):
    db_config = URL.create(
        url,
        username=username,
        password=password,
        host=host,
        database=database,
    )

    engine = create_engine(db_config,
                           pool_recycle=3600,
                           pool_size=20,
                           max_overflow=30,
                           pool_timeout=5,
                           pool_pre_ping=True)
    session_factory = sessionmaker(bind=engine)
    print("session created succesfully")
    # Base.metadata.create_all(engine)

    # new_db_session = scoped_session(session_factory)
    # return new_db_session
    return session_factory


def create_db_session_from_json_config_file():
    config = load_config("config.json")["db"]
    return create_db_session(config["url"], config["username"], config["password"], config["host"], config["database"])


def get_db_url_from_json_config_file():
    config = load_config("config.json")["db"]
    return f"{config['url']}://{config['username']}:{config['password']}@{config['host']}/{config['database']}"
