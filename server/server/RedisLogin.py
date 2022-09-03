import redis

class RedisLogin:
	def __init__(self, host = "127.0.0.1", port = 6379, db = 0):
		self.host = host
		self.port = port
		self.db   = db

		self.hashName = "Users"

		self.client = redis.StrictRedis(host = host, port = port, db = db)
		

	def HashUser(self, userNickname):
		return (self.hashName + ":" + userNickname)
	
	
	def AddUser(self, userNickname, userData):
		self.client.hmset(self.HashUser(userNickname), userData)


	def GetUser(self, userNickname):
		if self.client.exists(self.HashUser(userNickname)) == 0:
			return None

		user = self.client.hgetall(self.HashUser(userNickname))
		res = {}
		for field in user:
			res.update({field.decode() : user[field].decode()})
		return res