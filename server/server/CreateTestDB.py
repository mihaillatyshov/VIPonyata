from DBlib import (Course, DBsession, Dictionary, Drilling, DrillingCard,
                   Lesson, User)
from log_lib import LogI

if user := DBsession.query(User).filter_by(nickname="lm").one_or_none():
    LogI(user)
    LogI("Start createing test data")

    dictionary = [
        Dictionary(char_jp="かぞく", word_jp="家族", ru="семья", img="img/dictionary/dsa.png"),
        Dictionary(char_jp="しまい", word_jp="姉妹", ru="сестры")
    ]
    DBsession.add_all(dictionary)
    DBsession.commit()

    size = 10

    courses = [
        Course(name=f"Course {x}", difficulty="Hard", sort=500+x*10, description=f"Some course description {x}")
        for x in range(size)
    ]
    courses[0].users = [user]
    courses[1].users = [user]
    courses[2].users = [user]
    DBsession.add_all(courses)
    DBsession.commit()

    for course in courses:
        lessons = [
            Lesson(name=f"Lesson {x}", number=x, description=f"Some course description L{x} C{course.id}", course_id=course.id)
            for x in range(size)
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

        DBsession.add_all(lessons)
        DBsession.commit()

        drillings = [
            Drilling(description="Drilling with limit", lesson_id=lessons[0].id,
                     tasks="drillingfindpair,drillingscramble"),
            Drilling(description="Drilling with NO limit", lesson_id=lessons[1].id,
                     tasks="drillingfindpair,drillingscramble,drillingtranslate,drillingspace")
        ]
        DBsession.add_all(drillings)
        DBsession.commit()

        cards = [
            DrillingCard(sentence="わたしは家族が好きです。", answer="я люблю свою семью",
                         drilling_id=drillings[0].id, dictionary_id=dictionary[0].id),
            DrillingCard(sentence="私は姉妹がいる。", answer="у меня есть сестры",
                         drilling_id=drillings[0].id, dictionary_id=dictionary[1].id),

            DrillingCard(sentence="わたしは家族が好きです。", answer="я люблю свою семью",
                         drilling_id=drillings[1].id, dictionary_id=dictionary[0].id),
        ]
        DBsession.add_all(cards)
        DBsession.commit()

    LogI("Test data created successfuly")
