from . import RL

class RedisUser:
	def __init__(self):
		self.data = {}


	def FromDB(self, user_id):
		self.nickname = user_id
		self.data = RL.GetUser(user_id)
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
		return self.data["name"]
	def GetRegDate(self):
		return self.data["registration_date"]
	def GetLevel(self):
		return self.data["level"]
	def GetPassword(self):
		return self.data["password"]

	def IsStudent(self):
		return self.data["level"] == "0"
	def IsTeacher(self):
		return self.data["level"] == "1"
