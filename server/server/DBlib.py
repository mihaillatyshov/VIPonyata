from sqlalchemy import (Column, Date, DateTime, ForeignKey, Integer, String,
                        Table, Text, Time, create_engine)
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.sql import func

Base = declarative_base()


a_users_courses = Table("users_courses",  Base.metadata,
                        Column('id', Integer, primary_key=True),
                        Column('user_id', Integer, ForeignKey('users.id')),
                        Column('course_id', Integer, ForeignKey('courses.id')))


a_users_lessons = Table("users_lessons",  Base.metadata,
                        Column('id', Integer, primary_key=True),
                        Column('user_id', Integer, ForeignKey('users.id')),
                        Column('lesson_id', Integer, ForeignKey('lessons.id')))


class User(Base):
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
        return f"User: (id={self.id}; nickname={self.nickname}; level={self.level})"


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
        return f"Course: (id={self.id}; name={self.name})"


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
        return f"Lesson: (id={self.id}; name={self.name})"


class Dictionary(Base):
    __tablename__ = "dictionary"
    id = Column(Integer, primary_key=True)

    char_jp = Column(String(128))
    word_jp = Column(String(128))
    ru = Column(String(128))
    img = Column(String(1024))

    def __repr__(self):
        return f"Dictionary: (id={self.id}; char_jp={self.char_jp}; word_jp={self.char_jp}; ru={self.ru})"


class Drilling(Base):
    __tablename__ = "drillings"
    id = Column(Integer, primary_key=True)

    description = Column(String(2048))
    tasks = Column(String(2048), nullable=False)
    time_limit = Column(Time)

    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    lesson = relationship("Lesson")

    cards = relationship("DrillingCard")


class DrillingCard(Base):
    __tablename__ = "drilling_cards"
    id = Column(Integer, primary_key=True)

    sentence = Column(String(256), nullable=False)
    answer = Column(String(256), nullable=False)

    drilling_id = Column(Integer, ForeignKey("drillings.id"))

    dictionary_id = Column(Integer, ForeignKey("dictionary.id"))
    dictionary = relationship("Dictionary")


class DoneDrilling(Base):
    __tablename__ = "done_drillings"
    id = Column(Integer, primary_key=True)

    try_number = Column(Integer, nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    done_tasks = Column(String(2048))

    user_id = Column(Integer, ForeignKey("users.id"))

    drilling_id = Column(Integer, ForeignKey("drillings.id"))
    drilling = relationship("Drilling")


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


DBsession = CreateSession("mysql+mysqlconnector", "mihail", "dbnfvbys5", "localhost", "japan")
