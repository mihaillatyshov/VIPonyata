from datetime import datetime, time

from .db_models import Course, CreateSessionFromJsonFile, Dictionary, Drilling, DrillingCard, Hieroglyph, HieroglyphCard, Assessment, Lesson, User
from .log_lib import LogI
from werkzeug.security import generate_password_hash

DBsession = CreateSessionFromJsonFile()

hashPwd = generate_password_hash("dbnfvbys")
user = User(name="Mihail", nickname="lm", password=hashPwd, birthday=datetime.now(), level=User.Level.STUDENT)
userTeacher = User(name="Mary", nickname="mary", password=hashPwd, birthday=datetime.now(), level=User.Level.TEACHER)
DBsession().add_all([user, userTeacher])
DBsession().commit()

if user:
    LogI(user)
    LogI("Start creating test data")

    dictionary = [
        Dictionary(char_jp="家族", word_jp="かぞく", ru="семья", img="/img/dictionary/dsa.png"),
        Dictionary(char_jp="姉妹", word_jp="しまい", ru="сестры")
    ]
    DBsession().add_all(dictionary)
    DBsession().commit()

    size = 10

    courses = [
        Course(name=f"Course {x}", difficulty="Hard", sort=500 + x * 10, description=f"Some course description {x}")
        for x in range(size)
    ]
    courses[0].users = [user]
    courses[1].users = [user]
    courses[2].users = [user]
    DBsession().add_all(courses)
    DBsession().commit()

    for course in courses:
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
        DBsession().add_all(lessons)
        DBsession().commit()

        drillings = [
            Drilling(description="Drilling with limit",
                     lesson_id=lessons[0].id,
                     tasks="findpair,scramble",
                     time_limit=time(minute=10)),
            Drilling(description="Drilling with NO limit",
                     lesson_id=lessons[1].id,
                     tasks="findpair,scramble,translate,space"),
            Drilling(description="Drilling with limit",
                     lesson_id=lessons[2].id,
                     tasks="findpair,scramble",
                     time_limit=time(second=20)),
        ]
        DBsession().add_all(drillings)
        DBsession().commit()

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
        DBsession().add_all(d_cards)
        DBsession().commit()

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

        DBsession().add_all(hieroglyps)
        DBsession().commit()

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
        DBsession().add_all(h_cards)
        DBsession().commit()

        with open("assessment_example.json", "r") as file:
            data = file.read()
            LogI(data)
            LogI(type(data))
            assessments = [
                Assessment(description="Assessment with limit",
                           lesson_id=lessons[0].id,
                           tasks=data,
                           time_limit=time(minute=10)),
            ]
            DBsession().add_all(assessments)
            DBsession().commit()

    LogI("Test data created successfuly")
