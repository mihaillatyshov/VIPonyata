from . import RL
from . import DB

class RedisUser:
    def __init__(self):
        self.data = {}


    def FromDB(self, user_id):
        self.nickname = user_id
        self.data = RL.GetUser(user_id)
        #self.data.update(DB.GetTableJson("users", where=f"nickname='{user_id}'"))
        if (userData := DB.GetTableJson("users", f"Nickname='{user_id}'")):
            print(userData[0])
            self.data.update(userData[0])
        return self


    def IsExists(self):
        return self.data != None
    
    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.nickname)


    def GetNickname(self):
        return self.nickname
    def GetName(self):
        return self.data["Name"]
    def GetRegDate(self):
        return str(self.data["RegistrationDate"])
    def GetLevel(self):
        return self.data["Level"]
    def GetAvatar(self):
        return self.data["Avatar"]
    def GetForm(self):
        return self.data["Form"]
    def GetDBIndex(self):
        return self.data["Id"]
    def GetPassword(self):
        return self.data["password"]

    def IsStudent(self):
        return str(self.data["Level"]) == "0"
    def IsTeacher(self):
        return str(self.data["Level"]) == "1"
