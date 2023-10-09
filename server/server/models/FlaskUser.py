from flask_login import UserMixin

from server.common import DBsession
from server.models.db_models import User


class FlaskUser(UserMixin):
    def __init__(self):
        self.data = {}

    def FromDB(self, user_id):
        self.data = {}
        if user_data := DBsession.query(User).filter_by(nickname=user_id).one_or_none():
            self.data["id"] = user_data.id
            self.data["name"] = user_data.name
            self.data["nickname"] = user_data.nickname
            self.data["password"] = user_data.password
            self.data["level"] = user_data.level
            self.data["avatar"] = user_data.avatar
            self.data["form"] = user_data.form
            self.data["registration_date"] = user_data.registration_date
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
