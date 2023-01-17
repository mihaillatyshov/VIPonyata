import datetime
from sqlalchemy import (Column, Date, DateTime, ForeignKey, Integer, String, Table, Text, Time, create_engine, JSON)
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.sql import func

Base = declarative_base()

a_users_courses = Table("users_courses", Base.metadata, Column('id', Integer, primary_key=True),
                        Column('user_id', Integer, ForeignKey('users.id')),
                        Column('course_id', Integer, ForeignKey('courses.id')))

a_users_lessons = Table("users_lessons", Base.metadata, Column('id', Integer, primary_key=True),
                        Column('user_id', Integer, ForeignKey('users.id')),
                        Column('lesson_id', Integer, ForeignKey('lessons.id')))


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

    courses = relationship('Course', secondary=a_users_courses, backref='user')
    lessons = relationship('Lesson', secondary=a_users_lessons, backref='user')

    def __repr__(self):
        return f"<User: (id={self.id}; nickname={self.nickname}; level={self.level})>"


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

    users = relationship('User', secondary=a_users_courses, backref='course')

    lessons = relationship("Lesson")

    def __repr__(self):
        return f"<Course: (id={self.id}; name={self.name})>"


class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True)

    name = Column(String(128), nullable=False)
    number = Column(Integer, nullable=False)
    description = Column(String(2048))

    creation_datetime = Column(DateTime, default=func.now())

    users = relationship('User', secondary=a_users_lessons, backref='lesson')

    course_id = Column(Integer, ForeignKey("courses.id"))
    course = relationship("Course")

    drilling = relationship("Drilling")

    def __repr__(self):
        return f"<Lesson: (id={self.id}; name={self.name})>"


class Dictionary(Base):
    __tablename__ = "dictionary"
    id = Column(Integer, primary_key=True)

    char_jp = Column(String(128))
    word_jp = Column(String(128))
    ru = Column(String(128))
    img = Column(String(1024))

    drilling_card = relationship("DrillingCard")

    def __repr__(self):
        return f"<Dictionary: (id={self.id}; char_jp={self.char_jp}; word_jp={self.char_jp}; ru={self.ru})>"


class AbstractDAH(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True)

    description = Column(String(2048))
    tasks = Column(String(2048), nullable=False)
    time_limit = Column(Time)

    @declared_attr
    def lesson_id(cls):
        return Column(Integer, ForeignKey("lessons.id"))

    @declared_attr
    def lesson(cls):
        return relationship("Lesson")

    tries = []
    now_try = None

    def getTasksNames(self):
        return self.tasks.split(",")

    def getCardWords(self):
        wordsRU = []
        wordsJP = []
        charsJP = []
        for card in self.cards:
            wordsRU.append(card.dictionary.ru)
            wordsJP.append(card.dictionary.word_jp)
            charsJP.append(card.dictionary.char_jp)

        return wordsRU, wordsJP, charsJP

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


class AbstractCard(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True)

    sentence = Column(String(256), nullable=False)
    answer = Column(String(256), nullable=False)

    @declared_attr
    def dictionary_id(cls):
        return Column(Integer, ForeignKey("dictionary.id"))

    @declared_attr
    def dictionary(cls):
        return relationship("Dictionary")

    def __json__(self):
        data = {"word": self.dictionary}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        return data


class AbstractDone(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True)

    try_number = Column(Integer, nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime)
    done_tasks = Column(String(2048))

    @declared_attr
    def user_id(cls):
        return Column(Integer, ForeignKey("users.id"))

    def getDoneTasksDict(self) -> dict:
        res = {}
        if self.done_tasks:
            for task in self.done_tasks.split(","):
                key, val = task.split(":")
                res[key] = val
        return res

    def __json__(self):
        data = {}
        for column in self.__table__.columns:
            data[column.name] = getattr(self, column.name)
        data["done_tasks"] = self.getDoneTasksDict()
        return data


class Drilling(AbstractDAH):
    __tablename__ = "drillings"

    cards = relationship("DrillingCard")


class DrillingCard(AbstractCard):
    __tablename__ = "drilling_cards"

    drilling_id = Column(Integer, ForeignKey("drillings.id"))
    drilling = relationship("Drilling")


class DoneDrilling(AbstractDone):
    __tablename__ = "done_drillings"

    drilling_id = Column(Integer, ForeignKey("drillings.id"))
    drilling = relationship("Drilling")


class Hieroglyph(AbstractDAH):
    __tablename__ = "hieroglyphs"

    cards = relationship("HieroglyphCard")


class HieroglyphCard(AbstractCard):
    __tablename__ = "hieroglyph_cards"

    drilling_id = Column(Integer, ForeignKey("hieroglyphs.id"))
    drilling = relationship("Hieroglyph")


class DoneHieroglyph(AbstractDone):
    __tablename__ = "done_hieroglyphs"

    drilling_id = Column(Integer, ForeignKey("hieroglyphs.id"))
    drilling = relationship("Hieroglyph")


def CreateSession(url, username, password, host, database):
    db_config = URL.create(
        url,
        username=username,
        password=password,
        host=host,
        database=database,
    )

    engine = create_engine(db_config, echo=True)
    session = sessionmaker(bind=engine)()
    print("session created succesfully")
    Base.metadata.create_all(engine)

    return session
