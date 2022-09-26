from time import sleep
import mysql.connector
from mysql.connector import Error

class DataBase:
	def __init__(self, host_name, user_name, user_password, db_name):
		self.host_name = host_name
		self.user_name = user_name
		self.user_password = user_password
		self.db_name = db_name
		self.connection = self.CreateConnection()
	

	def CreateConnection(self):
		connection = None
		try:
			connection = mysql.connector.connect(
				host = self.host_name,
				user = self.user_name,
				passwd = self.user_password,
				database = self.db_name
			)
			print("[INFO] Connection to MySQL DB successful")
		except Error as e:
			print(f"[ERROR] Connection error: {e}")

		return connection


	def GetCursor(self):
		while True:
			try:
				if (self.connection == None):
					raise ValueError("Connection is None")
				cursor = self.connection.cursor()
				return cursor
			except Error as e:
				print(f"[ERROR] Cursor error: {e}")
				if (e.errno == -1):
					connection = self.CreateConnection()
					self.connection = connection
			except:
				print("[ERROR] Cursor error: Connection is None")
				self.connection = self.CreateConnection()
			sleep(2)


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


	def GetTableElements(self, tableName, where = None, start = -1, count = 65536, tableElements = None):
		whereStr = f"WHERE {where} " if where != None else ""
		limitStr = "LIMIT " + (f"{start}, " if start >= 0 else "") + f"{count}"
		elementsStr = tableElements if tableElements != None else "*" 
		select_elements = "SELECT " + elementsStr + f" FROM {tableName} " + whereStr + limitStr
		print("GetTableElements", select_elements)
		return self.ExecuteReadQuery(select_elements)
	

	def GetTableSize(self, tableName):
		select_comments = f"SELECT COUNT(*) FROM {tableName}"
		return self.ExecuteReadQuery(select_comments)[0][0]


	def GetTableElementsNames(self, tableName):
		return self.ExecuteReadQuery("DESCRIBE " + tableName)


	def MacroAllTableElements(self):
		return "ALL"

	def GetJsonFromNamesAndData(self, names, data):
		result = []
		for element in data:
			line = {}
			for field, name in zip(element, names):
				line.update({name : str(field) if field else field})
			result.append(line)
		return result

	def GetTableJson(self, tableName, where = None, start = -1, count = 65536, tableElements = None):
		DBData = self.GetTableElements(tableName, where = where, start = start, count = count, tableElements=tableElements)
		DBColData = []
		for name in tableName.split(","):
			columns = self.GetTableElementsNames(name)
			for column in columns:
				DBColData.append(column[0])
#		DBColData = self.GetTableElementsNames(tableName)
		return self.GetJsonFromNamesAndData(DBColData, DBData)

	def GetTablesJson(self, tables, where = None, start = -1, count = 65536):
		fromArr = []		# FROM
		columnArr = []		# Column names for json format
		selectArr = []		# SELECT
		print(tables)
		for name, info in tables.items():
			print(name, info)
			fromArr.append(name)
			if info.get("elements"):
				if info["elements"] == self.MacroAllTableElements():	# Select all elements form table
					columns = self.GetTableElementsNames(name)
					for column in columns:
						columnArr.append(column[0])
					selectArr.append(f"{name}.*")
				elif type(info["elements"]) is list:					# Select some elements form table
					for column in info["elements"]:
						columnArr.append(column)
						selectArr.append(f"{name}.{column}")

		selectStr = ", ".join(selectArr)
		fromStr = ", ".join(fromArr)
		data = self.GetTableElements(fromStr, where = where, start = start, count = count, tableElements=selectStr)

		return self.GetJsonFromNamesAndData(columnArr, data)
			