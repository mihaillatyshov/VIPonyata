from datetime import datetime, time

from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

from werkzeug.security import generate_password_hash

from server.log_lib import LogI
from server.models.db_models import (Assessment, Course, Dictionary, Drilling, DrillingCard, Hieroglyph, HieroglyphCard,
                                     Lesson, User)

from server.models.db_models import Base, create_db_engine, load_config

config = load_config("config.json")["db"]

db_config = URL.create(
    config["url"],
    username=config["username"],
    password=config["password"],
    host=config["host"],
    database=config["database"],
)

engine = create_db_engine(db_config)

DBsession = sessionmaker(bind=engine, expire_on_commit=False)

Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

# DBsession = create_db_session_from_json_config_file()

with DBsession.begin() as session:
    hashPwd = generate_password_hash("dbnfvbys")
    user = User(name="Mihail", nickname="lm", password=hashPwd, birthday=datetime.now(), level=User.Level.STUDENT)
    userTeacher = User(name="Mary",
                       nickname="mary",
                       password=hashPwd,
                       birthday=datetime.now(),
                       level=User.Level.TEACHER)
    session.add_all([user, userTeacher])
    LogI(user)

if user:
    LogI("Start creating test data")

    with DBsession.begin() as session:
        dictionary = [
            Dictionary(char_jp="家族", word_jp="かぞく", ru="семья", img="/test_data/lexis_img.png"),
            Dictionary(char_jp="姉妹", word_jp="しまい", ru="сестры")
        ]
        session.add_all(dictionary)

    size = 10

    with DBsession.begin() as session:
        courses = [
            Course(name=f"Course {x}", difficulty="Hard", sort=500 + x * 10, description=f"Some course description {x}")
            for x in range(size)
        ]
        courses[0].users = [user]
        courses[1].users = [user]
        courses[2].users = [user]
        session.add_all(courses)

    for course in courses:
        with DBsession() as session:
            lessons = [
                Lesson(name=f"Lesson {x}",
                       number=x,
                       description=f"Some course description L{x} C{course.id}",
                       course_id=course.id) for x in range(size)
            ]
            if course.id == courses[0].id:
                lessons[0].users = [user]
                lessons[1].users = [user]
                lessons[2].users = [user]
                lessons[3].users = [user]
                lessons[4].users = [user]
            if course.id == courses[1].id:
                lessons[0].users = [user]
                lessons[1].users = [user]
                lessons[2].users = [user]
                lessons[3].users = [user]
            session.add_all(lessons)
            session.commit()

            drillings = [
                Drilling(description="Drilling with limit",
                         lesson_id=lessons[0].id,
                         tasks="findpair,scramble",
                         time_limit=time(second=10)),
                Drilling(description="Drilling with NO limit",
                         lesson_id=lessons[1].id,
                         tasks="findpair,scramble,translate,space"),
                Drilling(description="Drilling with limit",
                         lesson_id=lessons[2].id,
                         tasks="findpair,scramble",
                         time_limit=time(second=20)),
            ]
            session.add_all(drillings)
            session.commit()

            d_cards = [
                DrillingCard(sentence="わたしは家族が好きです。",
                             answer="я люблю свою семью",
                             base_id=drillings[0].id,
                             dictionary_id=dictionary[0].id),
                DrillingCard(sentence="私は姉妹がいる。",
                             answer="у меня есть сестры",
                             base_id=drillings[0].id,
                             dictionary_id=dictionary[1].id),
                DrillingCard(sentence="わたしは家族が好きです。",
                             answer="я люблю свою семью",
                             base_id=drillings[1].id,
                             dictionary_id=dictionary[0].id),
            ]
            session.add_all(d_cards)
            session.commit()

            hieroglyps = [
                Hieroglyph(description="Hieroglyph with limit",
                           lesson_id=lessons[0].id,
                           tasks="findpair,scramble",
                           time_limit=time(minute=10)),
                Hieroglyph(description="Hieroglyph with NO limit",
                           lesson_id=lessons[1].id,
                           tasks="findpair,scramble,translate,space"),
                Hieroglyph(description="Hieroglyph with limit",
                           lesson_id=lessons[2].id,
                           tasks="findpair,scramble",
                           time_limit=time(second=20)),
            ]
            session.add_all(hieroglyps)
            session.commit()

            h_cards = [
                HieroglyphCard(sentence="わたしは家族が好きです。",
                               answer="я люблю свою семью",
                               base_id=hieroglyps[0].id,
                               dictionary_id=dictionary[0].id),
                HieroglyphCard(sentence="私は姉妹がいる。",
                               answer="у меня есть сестры",
                               base_id=hieroglyps[0].id,
                               dictionary_id=dictionary[1].id),
                HieroglyphCard(sentence="わたしは家族が好きです。",
                               answer="я люблю свою семью",
                               base_id=hieroglyps[1].id,
                               dictionary_id=dictionary[0].id),
            ]
            session.add_all(h_cards)
            session.commit()

            with open("assessment_example.json", "r") as file:
                data = file.read()
                # LogI(data)
                # LogI(type(data))
                assessments = [
                    Assessment(description="Assessment with limit",
                               lesson_id=lessons[0].id,
                               tasks=data,
                               time_limit=time(minute=10)),
                ]
                session.add_all(assessments)
                session.commit()

    LogI("Test data created successfuly")
