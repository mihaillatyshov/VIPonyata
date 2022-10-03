from calendar import c
from datetime import datetime, timedelta
import random
import hashlib
import threading
import os
from flask import current_app, request, session, jsonify
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
from . import DB


def GetSingleItem(DBRes):
	return DBRes[0] if DBRes else None


def StrToTimedelta(string):
	hms = string.split(":")
	return timedelta(hours=int(hms[0]), minutes=int(hms[1]), seconds=int(hms[2]))

print("MD5", hashlib.md5("JP1".encode()).hexdigest())


def DrillingEndTimeHandler(doneDrillingId):
	# Check if user end by hand
	doneDrilling = GetSingleItem(DB.GetTableJson("donedrillings", where=f"Id='{doneDrillingId}'"))
	if (not doneDrilling["EndTime"]):
		print("========= Not Hand ===============================")
		DB.UpdateTableElement("donedrillings", { "EndTime" : datetime.now() }, f"Id='{doneDrillingId}'")
	print("========= Timer End ===============================")


def TimeToInt(time):
	return time.second + time.minute * 60 + time.hour * 60 * 60


def CalcTasksDeadline(timeLimit, timeStart):
	return datetime.strptime(timeStart, '%Y-%m-%d %H:%M:%S') + StrToTimedelta(timeLimit)


def CalcTasksTimeRemaining(timeLimit, timeStart):
	timeNow = datetime.now()
	endTime = CalcTasksDeadline(timeLimit, timeStart)
	return (endTime - timeNow).seconds if endTime > timeNow else 0


def OnRestartServerCheckTasksTimers():
	print("[START]: OnRestartServerCheckTasksTimers")
	drillings = DB.GetTablesJson({ "drillings": { "elements" : ["TimeLimit"] }, "donedrillings" : { "elements" : ["Id", "StartTime"] } }, 
		where=f"drillings.Id = donedrillings.DrillingId AND drillings.TimeLimit IS NOT NULL AND donedrillings.EndTime IS NULL")
	print(drillings)
	for drilling in drillings:
		timeRemaining = CalcTasksTimeRemaining(drilling["TimeLimit"], drilling["StartTime"])
		print(timeRemaining)
		threading.Timer(CalcTasksTimeRemaining(drilling["TimeLimit"], drilling["StartTime"]), DrillingEndTimeHandler, args = { drilling["Id"] }).start()
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
			print(doneDrillings[-1])
			return { "result" : "Already Exists" }

		print("==== 2 ===============================")
		DB.AddTableElement("donedrillings", { 
			"TryNumber" : length + 1 , 
			"StartTime" : datetime.now(), 
			"UserId" : current_user.GetDBIndex(), 
			"DrillingId" : id 
		})
		if (drilling["TimeLimit"]) : 
			print("========= Timer Start ===============================")
			doneDrilling = DB.GetTableJson("donedrillings", where=f"DrillingId='{id}' ORDER BY TryNumber")[-1]
			threading.Timer(StrToTimedelta(drilling["TimeLimit"]).seconds, DrillingEndTimeHandler, args = { doneDrilling["Id"] }).start()
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
				drilling["Deadline"] = str(CalcTasksDeadline(drilling["TimeLimit"], doneDrilling["StartTime"]))
			else:
				drilling["Deadline"] = None

			print("================= Drilling =================")
			tasks = {}
			wordsRU = []
			wordsJP = []
			# Drilling Card
			tasks["drillingcard"] = DB.GetTableJson("drillingcard", where=f"DrillingId='{id}'")
			print("Drilling card:", tasks["drillingcard"])
			if tasks["drillingcard"]:
				# Get Words from dictionary
				for card in tasks['drillingcard']:
					card["Word"] = GetSingleItem(DB.GetTableJson("dictionary", where=f"Id='{card['DictionaryId']}'"))
					wordsRU.append(card["Word"]["RU"])
					wordsJP.append(card["Word"]["WordJP"])
				print("Words RU:", wordsRU)
				print("Words JP:", wordsJP)

				tasksNames = drilling["Tasks"].split(",")

				# Drilling Find Pair
				if "drillingfindpair" in tasksNames:
					shuffleWordsRU = wordsRU.copy()
					random.shuffle(shuffleWordsRU)
					shuffleWordsJP = wordsJP.copy()
					random.shuffle(shuffleWordsJP)
					answers = { "WordsRU" : [], "WordsJP" : [] }
					for word in shuffleWordsRU:
						answers["WordsRU"].append(shuffleWordsRU.index(word))
						answers["WordsJP"].append(shuffleWordsJP.index(wordsJP[wordsRU.index(word)]))
					print(answers)
					tasks["drillingfindpair"] = { "WordsRU" : shuffleWordsRU, "WordsJP" : shuffleWordsJP, "answers" : answers }

				# Drilling Scramble
				if "drillingscramble" in tasksNames:
					shuffleWordsJP = wordsJP.copy()
					random.shuffle(shuffleWordsJP)
					chars = []
					for word in shuffleWordsJP:
						chars.append(list(word))
						random.shuffle(chars[-1])
					print("SWJP", shuffleWordsJP)
					print("Chars", chars)
					tasks["drillingscramble"] = { "words" : shuffleWordsJP, "chars" : chars }

				# Drilling Translate
				if "drillingtranslate" in tasksNames:
					tasks["drillingtranslate"] = { "WordsJP" : wordsJP, "WordsRU" : wordsRU }

				# Drilling Space
				if "drillingspace" in tasksNames:
					spaceWords = []
					for i in range(len(wordsJP)):
						word = wordsJP[i]
						if len(word) == 1:
							spaceWords.append({ "WordJP" : word, "WordRU" : wordsRU[i], "WordStart" : "", "WordEnd" : "", "Spaces" : 1 })
						elif len(word) == 2:
							spaceWords.append({ "WordJP" : word, "WordRU" : wordsRU[i], "WordStart" : "", "WordEnd" : word[-1], "Spaces" : 2 })
						else:
							spaceWords.append({ "WordJP" : word, "WordRU" : wordsRU[i], "WordStart" : word[1], "WordEnd" : word[-1], "Spaces" : len(word) - 2 })
							

					tasks["drillingspace"] = { "Words" : spaceWords }


				return { "drilling" : drilling, "items" : tasks }

	return { "drilling" : None, "items" : None }, 403
			