import datetime
from typing import Any, Type, TypeVar

from sqlalchemy import (Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Table, Text, Time,
                        UniqueConstraint, create_engine)
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import relationship, scoped_session, sessionmaker
from sqlalchemy.sql import func

from server.load_config import load_config

Base: Type = declarative_base()

USERS_ID = "users.id"

a_users_courses = Table("users_courses", Base.metadata, Column("id", Integer, primary_key=True),
                        Column("user_id", Integer, ForeignKey(USERS_ID), nullable=False),
                        Column("course_id", Integer, ForeignKey("courses.id"), nullable=False),
                        UniqueConstraint('user_id', 'course_id', name='idx_user_course'))

a_users_lessons = Table("users_lessons", Base.metadata, Column("id", Integer, primary_key=True),
                        Column("user_id", Integer, ForeignKey(USERS_ID), nullable=False),
                        Column("lesson_id", Integer, ForeignKey("lessons.id"), nullable=False),
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

    courses = relationship("Course", secondary=a_users_courses, overlaps="courses,user")
    lessons = relationship("Lesson", secondary=a_users_lessons, overlaps="lessons,user")

    users_dictionary = relationship("UserDictionary", back_populates="user")

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

    users = relationship("User", secondary=a_users_courses, overlaps="courses,user")

    lessons = relationship("Lesson", back_populates="course")

    def __repr__(self):
        return f"<Course: (id={self.id}, name={self.name})>"


#########################################################################################################################
################ Lesson #################################################################################################
#########################################################################################################################
class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True)

    name = Column(String(128), nullable=False)
    number = Column(Integer, nullable=False)
    description = Column(String(2048))
    img = Column(String(1024))

    creation_datetime = Column(DateTime, default=func.now())

    users = relationship("User", secondary=a_users_lessons, overlaps="lessons,user")

    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    course = relationship("Course", back_populates="lessons")

    drilling = relationship("Drilling", uselist=False)
    hieroglyph = relationship("Hieroglyph", uselist=False)

    assessment = relationship("Assessment", uselist=False)
    final_boss = relationship("FinalBoss", uselist=False)

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

    users_dictionary = relationship("UserDictionary", back_populates="dictionary")

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
    user = relationship("User", back_populates="users_dictionary")

    dictionary_id = Column(Integer, ForeignKey("dictionary.id"), nullable=False)
    dictionary = relationship("Dictionary", back_populates="users_dictionary")

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
    id = Column(Integer, primary_key=True)

    description = Column(String(2048))

    time_limit = Column(Time)

    @declared_attr
    def lesson_id(cls):
        return Column(Integer, ForeignKey("lessons.id"), nullable=False)

    @declared_attr
    def lesson(cls):
        return relationship("Lesson", overlaps="drilling,hieroglyph,assessment,final_boss")

    tries: list = []
    now_try: Any | None = None

    def time_limit__ToTimedelta(self) -> datetime.timedelta:
        return datetime.timedelta(hours=self.time_limit.hour,
                                  minutes=self.time_limit.minute,
                                  seconds=self.time_limit.second,
                                  microseconds=self.time_limit.microsecond)

    def calcDeadline(self) -> datetime.datetime | None:
        if not self.time_limit:
            return None

        if self.now_try:
            return self.now_try.start_datetime + self.time_limit__ToTimedelta()
        if self.tries and not self.tries[-1].end_datetime:
            return self.tries[-1].start_datetime + self.time_limit__ToTimedelta()

        return None

    def __json__(self):
        data = {"tries": self.tries, "deadline": self.calcDeadline(), "try": self.now_try}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data


class AbstractActivityTry(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True)

    try_number = Column(Integer, nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime)

    @declared_attr
    def user_id(cls):
        return Column(Integer, ForeignKey(USERS_ID), nullable=False)

    @declared_attr
    def user(cls):
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

    def getCardWords(self):
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

    @declared_attr
    def dictionary_id(cls):
        return Column(Integer, ForeignKey("dictionary.id"), nullable=False)

    @declared_attr
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

    cards = relationship("DrillingCard")


class DrillingCard(AbstractLexisCard):
    __tablename__ = "drilling_cards"

    base_id = Column(Integer, ForeignKey("drillings.id"), nullable=False)
    base = relationship("Drilling", back_populates="cards")


class DrillingTry(AbstractLexisTry):
    __tablename__ = "drilling_tries"

    base_id = Column(Integer, ForeignKey("drillings.id"), nullable=False)
    base = relationship("Drilling")


#########################################################################################################################
################ Hieroglyph #############################################################################################
#########################################################################################################################
class Hieroglyph(AbstractLexis):
    __tablename__ = "hieroglyphs"

    cards = relationship("HieroglyphCard")


class HieroglyphCard(AbstractLexisCard):
    __tablename__ = "hieroglyph_cards"

    base_id = Column(Integer, ForeignKey("hieroglyphs.id"), nullable=False)
    base = relationship("Hieroglyph", back_populates="cards")


class HieroglyphTry(AbstractLexisTry):
    __tablename__ = "hieroglyph_tries"

    base_id = Column(Integer, ForeignKey("hieroglyphs.id"), nullable=False)
    base = relationship("Hieroglyph")


#########################################################################################################################
################ AbstractAssessment #####################################################################################
#########################################################################################################################
class AbstractAssessment(AbstractActivity):
    __abstract__ = True

    tasks = Column(Text, nullable=False)

    def __json__(self):
        data = super().__json__()
        del data["tasks"]
        return data


class AbstractAssessmentTry(AbstractActivityTry):
    __abstract__ = True

    done_tasks = Column(Text, nullable=False)
    checked_tasks = Column(Text)


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
class Assessment(AbstractAssessment):
    __tablename__ = "assessments"


class AssessmentTry(AbstractAssessmentTry):
    __tablename__ = "assessment_tries"

    base_id = Column(Integer, ForeignKey("assessments.id"))
    base = relationship("Assessment")


#########################################################################################################################
################ FinalBoss ##############################################################################################
#########################################################################################################################
class FinalBoss(AbstractAssessment):
    __tablename__ = "final_bosses"


class FinalBossTry(AbstractAssessmentTry):
    __tablename__ = "final_boss_tries"

    base_id = Column(Integer, ForeignKey("final_bosses.id"))
    base = relationship("FinalBoss")


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
    drilling_try = relationship("DrillingTry")

    hieroglyph_try_id = Column(Integer, ForeignKey("hieroglyph_tries.id"))
    hieroglyph_try = relationship("HieroglyphTry")

    assessment_try_id = Column(Integer, ForeignKey("assessment_tries.id"))
    assessment_try = relationship("AssessmentTry")

    final_boss_try_id = Column(Integer, ForeignKey("final_boss_tries.id"))
    final_boss_try = relationship("FinalBossTry")

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

    course_id = Column(Integer, ForeignKey("drilling_tries.id"))
    course = relationship("DrillingTry")

    lesson_id = Column(Integer, ForeignKey("hieroglyph_tries.id"))
    lesson = relationship("HieroglyphTry")

    assessment_try_id = Column(Integer, ForeignKey("assessment_tries.id"))
    assessment_try = relationship("AssessmentTry")

    final_boss_try_id = Column(Integer, ForeignKey("final_boss_tries.id"))
    final_boss_try = relationship("FinalBossTry")

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
def time_limit_to_timedelta(time_limit: Time) -> datetime.timedelta:
    return datetime.timedelta(hours=time_limit.hour,
                              minutes=time_limit.minute,
                              seconds=time_limit.second,
                              microseconds=time_limit.microsecond)


ActivityType = TypeVar("ActivityType", Drilling, Hieroglyph, Assessment, FinalBoss)
ActivityTryType = TypeVar("ActivityTryType", DrillingTry, HieroglyphTry, AssessmentTry, FinalBossTry)

LexisType = TypeVar("LexisType", Drilling, Hieroglyph)
LexisCardType = TypeVar("LexisCardType", DrillingCard, HieroglyphCard)
LexisTryType = TypeVar("LexisTryType", DrillingTry, HieroglyphTry)

AssessmentType = TypeVar("AssessmentType", Assessment, FinalBoss)
AssessmentTryType = TypeVar("AssessmentTryType", AssessmentTry, FinalBossTry)


def create_db_session(url, username, password, host, database):
    db_config = URL.create(
        url,
        username=username,
        password=password,
        host=host,
        database=database,
    )

    engine = create_engine(db_config, pool_recycle=3600, pool_size=20, max_overflow=30, pool_timeout=5)
    session_factory = sessionmaker(bind=engine)
    print("session created succesfully")
    # Base.metadata.create_all(engine)

    new_db_session = scoped_session(session_factory)
    return new_db_session


def create_db_session_from_json_config_file():
    config = load_config("config.json")["db"]
    return create_db_session(config["url"], config["username"], config["password"], config["host"], config["database"])


def get_db_url_from_json_config_file():
    config = load_config("config.json")["db"]
    return f"{config['url']}: //{config['username']}: {config['password']}@{config['host']}/{config['database']}"
