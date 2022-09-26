from datetime import datetime
import random
import threading
import os
from flask import current_app, request, session, jsonify
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
from . import DB


def GetSingleItem(DBRes):
	return DBRes[0] if DBRes else None


def DrillingEndTimeHandler(doneDrillingId):
	# Check if user end by hand
	doneDrilling = GetSingleItem(DB.GetTableJson("donedrillings", where=f"Id='{doneDrillingId}'"))
	if (not doneDrilling["EndTime"]):
		print("========= Not Hand ===============================")
		DB.UpdateTableElement("donedrillings", { "EndTime" : datetime.now() }, f"Id='{doneDrillingId}'")
	print("========= Timer End ===============================")


def TimeToInt(time):
	return time.second + time.minute * 60 + time.hour * 60 * 60


def CalcTasksTimeRemaining(timeLimit, timeStart):
	print(timeLimit, timeStart)
	timeRemaining = (timeLimit - (datetime.now() - timeStart))
	return TimeToInt(timeRemaining if timeRemaining.year >= timeLimit.year else datetime.min)


def OnRestartServerCheckTasksTimers():
	print("[START]: OnRestartServerCheckTasksTimers")
	drillings = DB.GetTablesJson({ "drillings": { "elements" : ["TimeLimit"] }, "donedrillings" : { "elements" : ["Id", "StartTime"] } }, 
		where=f"drillings.Id = donedrillings.DrillingId AND drillings.TimeLimit IS NOT NULL AND donedrillings.EndTime IS NULL")
	print(drillings)
	for drilling in drillings:
		timeRemaining = CalcTasksTimeRemaining(
			datetime.strptime(drilling["TimeLimit"], '%H:%M:%S'), 
			datetime.strptime(drilling["StartTime"], '%Y-%m-%d %H:%M:%S'))
		print(timeRemaining)
		threading.Timer(timeRemaining, DrillingEndTimeHandler, args = { drilling["Id"] }).start()
		print(drilling["TimeLimit"], drilling["StartTime"], drilling["Id"])
	print("[ END ]: OnRestartServerCheckTasksTimers")


OnRestartServerCheckTasksTimers()


UPLOAD_FOLDER = "C:/Coding/Web/VIPonyata/client/public"

@current_app.route("/api/upload", methods=["POST"])
def fileUpload():
	target=os.path.join(UPLOAD_FOLDER, "img")
	if not os.path.isdir(target):
		os.mkdir(target)
	print("==========================================================")
	print("welcome to upload`")
	print(len(request.files))
	if (len(request.files) == 0):
		return jsonify("img/Test.png")
	file = request.files["file"] 
	filename = secure_filename(file.filename)
	destination="/".join([target, filename])
	file.save(destination)
	session["uploadFilePath"]=destination
	response = "img/" + filename
	print("==========================================================")
	return jsonify(response)


def UpdeteTimersOnRestart():
	pass


@current_app.route("/api/courses", methods=["GET"])
@login_required
def getAllCourses():
	#### Teacher
	if current_user.IsTeacher():
		courses = DB.GetTableJson("courses") # Get courses
		return { "items": courses }
	
	#### Student
	# Get available courses
	courses = DB.GetTablesJson( 
		{ "courses": { "elements" : "ALL" }, "usercourses" : { } }, 
		where=f"courses.Id = usercourses.CourseId AND usercourses.UserId = '{current_user.GetDBIndex()}'")
	
	return { "items": courses }



@current_app.route("/api/courses/<id>", methods=["GET"])
@login_required
def getCourseById(id):
	#### Teacher
	if current_user.IsTeacher():
		course = GetSingleItem(DB.GetTableJson("courses", where=f"Id='{id}'")) # Get course by id
		if course: # Check is course exists
			lessons = DB.GetTableJson("lessons", where=f"CourseId='{id}'") # Get course lessons
			return { "course" : course, "items" : lessons }

	#### Student #### TODO FIX
	if GetSingleItem(DB.GetTableJson("usercourses", where=f"CourseId = '{id}' AND UserId = '{current_user.GetDBIndex()}'")): # Check is course available
		course = GetSingleItem(DB.GetTableJson("courses", where=f"Id='{id}'")) # Get course by id
		if course: # Check is course exists
			# Get available lessons
			lessons = DB.GetTablesJson({ "lessons" : { "elements" : "ALL" }, "userlessons" : { } }, 
				where=f"lessons.Id = userlessons.LessonId AND lessons.CourseId = '{id}' AND userlessons.UserId = '{current_user.GetDBIndex()}'")
			return { "course" : course, "items" : lessons }

	return { "course" : None, "items" : None }, 403


@current_app.route("/api/lessons/<id>", methods=["GET"])
@login_required
def getLessonById(id):
	#### Teacher
	if current_user.IsTeacher():
		lesson = GetSingleItem(DB.GetTableJson("lessons", where=f"Id='{id}'"))
		if lesson:
			drilling = GetSingleItem(DB.GetTableJson("drillings", where=f"LessonId = '{lesson['Id']}'"))
			#doneDrillings = DB.GetTableJson("donedrillings", where=f"DrillingId='{drilling['Id']}' AND EndTime IS NOT NULL ORDER BY TryNumber") if drilling else None
			#if drilling: drilling["tries"] = doneDrillings
			
			#assesment = GetSingleItem(DB.GetTablesJson( { "assesments" : { "elements" : "ALL" }, "lessons" : { } }, where=f"assesments.LessonId = '{lesson['Id']}'"))
			#hieroglyph = GetSingleItem(DB.GetTablesJson( { "hieroglyphs" : { "elements" : "ALL" }, "lessons" : { } }, where=f"hieroglyphs.LessonId = '{lesson['Id']}'"))
			
			return { "lesson" : lesson, "items" : { "drilling" : drilling } }

	#### Student
	lesson = GetSingleItem(DB.GetTablesJson({ "lessons" : { "elements" : "ALL" }, "userlessons" : { } }, 
		where=f"lessons.Id = userlessons.LessonId AND lessons.Id = '{id}' AND userlessons.UserId = '{current_user.GetDBIndex()}'"))
	if lesson:
		drilling = GetSingleItem(DB.GetTableJson("drillings", where=f"LessonId = '{lesson['Id']}'"))
		doneDrillings = DB.GetTableJson("donedrillings", where=f"DrillingId='{drilling['Id']}' ORDER BY TryNumber") if drilling else None
		if drilling: drilling["tries"] = doneDrillings


		#assesment = GetSingleItem(DB.GetTablesJson( { "assesments" : { "elements" : "ALL" }, "lessons" : { } }, where=f"assesments.LessonId = '{lesson['Id']}'"))
		#hieroglyph = GetSingleItem(DB.GetTablesJson( { "hieroglyphs" : { "elements" : "ALL" }, "lessons" : { } }, where=f"hieroglyphs.LessonId = '{lesson['Id']}'"))
		
		return jsonify({ "lesson" : lesson, "items" : { "drilling" : drilling } })

	return { "lesson" : None, "items" : None }, 403


@current_app.route("/api/drilling/<id>/newtry", methods=["POST"])
@login_required
def createNewDrillingTry(id):
	if not current_user.IsStudent():
		return { "result" : "You are not student!" }, 403

	drilling = GetSingleItem(DB.GetTablesJson({ "drillings" : { "elements" : "ALL" }, "userlessons" : { } }, 
		where=f"drillings.Id = '{id}' AND drillings.LessonId = userlessons.LessonId AND userlessons.UserId = '{current_user.GetDBIndex()}'"))
	if drilling: # Check if user have access to this lesson
		doneDrillings = DB.GetTableJson("donedrillings", where=f"DrillingId='{id}' ORDER BY TryNumber")
		length = len(doneDrillings) if doneDrillings else 0

		if doneDrillings and doneDrillings[-1].get("EndTime") == None:
			print("==== 1 ===============================")
			print("==== ban ===============================")
			print(doneDrillings[-1])
			return { "result" : "Already Exists" }

		print("==== 2 ===============================")
		DB.AddTableElement("donedrillings", { 
			"TryNumber" : length + 1 , 
			"StartTime" : datetime.now(), 
			"UserId" : current_user.GetDBIndex(), 
			"DrillingId" : id 
		})
		#### TODO if have time limit, start timer to end it
		if (drilling["TimeLimit"]) : 
			print("========= Timer Start ===============================")
			doneDrilling = DB.GetTableJson("donedrillings", where=f"DrillingId='{id}' ORDER BY TryNumber")[-1]
			timeLimit = datetime.strptime(drilling["TimeLimit"], '%H:%M:%S').time()
			print("Time Limit: ", timeLimit)
			print("Time Limit: ", TimeToInt(timeLimit))
			threading.Timer(TimeToInt(timeLimit), DrillingEndTimeHandler, args = { doneDrilling["Id"] }).start()
		return { "result" : f"Created!" }


@current_app.route("/api/drilling/<id>", methods=["GET"])
@login_required
def getDrillingById(id):
	#### Teacher
	if current_user.IsTeacher():
		drilling = GetSingleItem(DB.GetTablesJson({ "drillings" : { "elements" : "ALL" } }, 
				where=f"drillings.Id = '{id}' AND drillings.LessonId = userlessons.LessonId AND userlessons.UserId = '{current_user.GetDBIndex()}'"))

	#### Student
	drilling = GetSingleItem(DB.GetTablesJson({ "drillings" : { "elements" : "ALL" }, "userlessons" : { } }, 
		where=f"drillings.Id = '{id}' AND drillings.LessonId = userlessons.LessonId AND userlessons.UserId = '{current_user.GetDBIndex()}'"))
	if drilling: # Check if user have access to this lesson
		doneDrilling = GetSingleItem(DB.GetTableJson("donedrillings", where=f"DrillingId='{id}' AND EndTime IS NULL"))
		if doneDrilling:
			drilling["try"] = doneDrilling
			if drilling["TimeLimit"]:
				drilling["TimeRemaining"] = CalcTasksTimeRemaining(
					datetime.strptime(drilling["TimeLimit"], '%H:%M:%S'), 
					datetime.strptime(doneDrilling["StartTime"], '%Y-%m-%d %H:%M:%S'))
			else:
				drilling["TimeRemaining"] = None

			tasks = {}
			tasksTypes = DB.GetTableJson("drillingtaskstypes")
			print(tasksTypes)
			for taskType in tasksTypes:
				taskData = DB.GetTableJson(taskType["Name"], where=f"DrillingId='{id}'")

				# Drilling Card
				if taskType["Name"] == "drillingcard":
					for task in taskData:
						task["Word"] = GetSingleItem(DB.GetTableJson("dictionary", where=f"Id='{task['DictionaryId']}'"))

				# Drilling Card
				if taskType["Name"] == "drillingfindpair":
					taskData = GetSingleItem(taskData)
					if taskData:
						taskData["RU"] = taskData.pop("RU").split("\|/") 
						random.shuffle(taskData["RU"])
						taskData["JP"] = taskData.pop("JP").split("\|/")
						random.shuffle(taskData["JP"])

				# Set task data in json with all tasks
				tasks[taskType["Name"]] = taskData
			return { "drilling" : drilling, "items" : tasks }



	return { "drilling" : None, "items" : None }, 403
#		drillingTasksTypes = DB.GetTableJson("drillingtaskstypes")
#			print(drillingTasksTypes)
#			drilling = {}
#			for tasksType in drillingTasksTypes:
#				tasks = DB.GetTableJson(tasksType["Name"])
#				drilling.update({ tasksType["Name"] : tasks })
			