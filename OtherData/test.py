# import threading

# def SomeFunction(arg1, arg2):
#     print("[START] Some Function Work", arg1)
#     print("[ END ] Some Function Work", arg2)

# def printit():
#     threading.Timer(5.0, SomeFunction, args={10, 15}).start()
#     print("Hello, World!")

# printit()

# for i in range(10):
#     print("Some work")

# continue with the rest of your code

from server import DBsession
from server.DBlib import Course, User

from datetime import datetime

print("========================================== Start Test ==========================================")
print(DBsession().query(Course).filter_by(id=2).one_or_none())

# newUser = User(name="Mihail", nickname="LM", password="dss", birthday=datetime.now(), level=0)
# DBsession().add(newUser)
# DBsession().commit()
# DBsession().add(Course(name="C1", difficulty="Hard"))
# DBsession().commit()


def GetDictFromSingleItem(func):
    def wrapper(*args, **kwargs):
        res = {}
        if DBRes := func(*args, **kwargs):
            for column in DBRes.__table__.columns:
                res[column.name] = getattr(DBRes, column.name)
        return res

    return wrapper


@GetDictFromSingleItem
def GetCourseById(courseId: int):
    return DBsession().query(Course).filter_by(id=courseId).one_or_none()


@GetDictFromSingleItem
def TestAll():
    return DBsession().query(Course).filter(Course.id == 1).join(Course.users).add_column(User.avatar).one_or_none()

    name = Column(String(128), nullable=False)
    nickname = Column(String(128), nullable=False, unique=True)
    password = Column(String(512), nullable=False)
    birthday = Column(Date, nullable=False)
    theme = Column(String(128))
    level = Column(Integer, nullable=False)
    avatar = Column(String(1024))
    form = Column(Text)


# DBsession().add(User(name="Das", nickname="Das", password="Das", birthday=datetime.now(), level=0))
# DBsession().commit()

UC = DBsession().query(User, Course).all()                                                                              # BAD SO BAD!!!
print("          1: ", UC)
for user, course in UC:
    print(user.id, "  ", course.id)
print("          2: ", DBsession().query(User).filter_by(id=1).join(User.courses).filter(Course.id == 2).one_or_none())
print("          3: ", DBsession().query(Course).join(Course.users).filter(User.id == 1).all())
                                                                                                                        #print("          4: ", TestAll())
