from flask_login import UserMixin

from . import DBsession
from .db_models import User


class FlaskUser(UserMixin):
    def __init__(self):
        self.data = {}

    def FromDB(self, user_id):
        self.data = {}
        if userData := DBsession.query(User).filter_by(nickname=user_id).one_or_none():
            print(userData)
            self.data["id"] = userData.id
            self.data["name"] = userData.name
            self.data["nickname"] = userData.nickname
            self.data["password"] = userData.password
            self.data["level"] = userData.level
            self.data["avatar"] = userData.avatar
            self.data["form"] = userData.form
            self.data["registration_date"] = userData.registration_date
        return self

    def IsExists(self):
        return self.data != {}

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return self.data.get("nickname")

    def GetId(self):
        return self.data["id"]

    def GetNickname(self):
        return self.data["nickname"]

    def GetName(self):
        return self.data["name"]

    def GetRegDate(self):
        return str(self.data["registration_date"])

    def GetLevel(self):
        return self.data["level"]

    def GetAvatar(self):
        return self.data["avatar"]

    def GetForm(self):
        return self.data["form"]

    def GetPassword(self):
        return self.data["password"]

    def IsStudent(self):
        return self.data["level"] == User.Level.STUDENT

    def IsTeacher(self):
        return self.data["level"] == User.Level.TEACHER
