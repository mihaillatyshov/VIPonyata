import mysql.connector
from mysql.connector import Error

class DataBase:
	def __init__(self, host_name, user_name, user_password, db_name):
		self.host_name = host_name
		self.user_name = user_name
		self.user_password = user_password
		self.db_name = db_name
		self.connection = self.CreateConnection()
	

	def CreateConnection(self,):
		connection = None
		try:
			connection = mysql.connector.connect(
				host = self.host_name,
				user = self.user_name,
				passwd = self.user_password,
				database = self.db_name
			)
			print("Connection to MySQL DB successful")
		except Error as e:
			print(f"The error '{e}' occurred")

		return connection


	def GetCursor(self):
		try:
			cursor = self.connection.cursor()
			return cursor
		except Error as e:
			print("ERRRROR!!!")
			print(f"The error '{e}' occurred")
			if (e.errno == -1):
				connection = self.CreateConnection()
				if (connection):
					self.connection = connection


	def CreateDatabase(self, db_name):
		query = "CREATE DATABASE " + db_name
		cursor = self.GetCursor()
		try:
			cursor.execute(query)
			print("Database created successfully")
		except Error as e:
			print(f"The error '{e}' occurred")


	def ExecuteQuery(self, query):
		cursor = self.GetCursor()
		try:
			cursor.execute(query)
			self.connection.commit()
			print("Query(E) executed successfully")
		except Error as e:
			print(f"The error '{e}' occurred")


	def ExecuteManyQuery(self, query, data):
		cursor = self.GetCursor()
		try:
			cursor.executemany(query, data)
			self.connection.commit()
			print("Query(EM) executed successfully")
		except Error as e:
			print(f"The error '{e}' occurred")


	def ExecuteReadQuery(self, query):
		cursor = self.GetCursor()
		result = None
		try:
			cursor.execute(query)
			result = cursor.fetchall()
			return result
		except Error as e:
			print(f"The error '{e}' occurred")
	

	def AddTableElement(self, tableName, data):
		columns = ",".join(list(map(lambda key : "`" + str(key) 		+ "`", data.keys())))
		values	= ",".join(list(map(lambda key : "'" + str(data[key]) 	+ "'", data.keys())))
		print(columns)
		print(values)
		self.ExecuteQuery(f"INSERT INTO `{tableName}` ( {columns} ) VALUES ( {values} )")


	def UpdateTableElement(self, tableName, data, where = None):
		update_elements = ",".join(list(map(lambda key : "`" + str(key) + "` = '" + str(data[key]) + "'", data.keys())))
		update_elements = f"UPDATE {tableName} SET " + update_elements + (f"WHERE {where} " if where != None else "")
		self.ExecuteQuery(update_elements)


	def GetTableElements(self, tableName, where = None, start = -1, count = 65536):
		select_elements = f"SELECT * FROM {tableName} " + (f"WHERE {where} " if where != None else "") + "LIMIT " + (f"{start}, " if start >= 0 else "") + f"{count}"
		print(select_elements)
		return self.ExecuteReadQuery(select_elements)
	

	def GetTableSize(self, tableName):
		select_comments = f"SELECT COUNT(*) FROM {tableName}"
		return self.ExecuteReadQuery(select_comments)[0][0]


	def GetTableElementsNames(self, tableName):
		return self.ExecuteReadQuery("DESCRIBE " + tableName)


	def GetTableJson(self, tableName, where = None, start = -1, count = 65536):
		DBData = self.GetTableElements(tableName, where = where, start = start, count = count)
		DBColData = self.GetTableElementsNames(tableName)
		result = []
		for data in DBData:
			line = {}
			for field, name in zip(data, DBColData):
				line.update({name[0] : field})
			result.append(line)
		return result