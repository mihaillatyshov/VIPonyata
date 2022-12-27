import hashlib
import os
import random
import threading
from datetime import datetime, timedelta

from flask import current_app, jsonify, request, session
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename

from . import DB
from .queries import OtherDBqueries as DBQO
from .queries import StudentDBqueries as DBQS
from .queries import TeacherDBqueries as DBQT


def GetCurrentUserId() -> int:
    return current_user.get_id()  # type: ignore


def GetCurrentUserIsTeacher() -> bool:
    return current_user.IsTeacher()  # type: ignore


def GetCurrentUserIsStudent() -> bool:
    return current_user.IsStudent()  # type: ignore


def GetSingleItem(DBRes):
    return DBRes[0] if DBRes else None


def StrToTimedelta(string):
    hms = string.split(":")
    return timedelta(hours=int(hms[0]), minutes=int(hms[1]), seconds=int(hms[2]))


print("MD5", hashlib.md5("JP1".encode()).hexdigest())


def DrillingEndTimeHandler(doneDrillingId):
    doneDrilling = DBQO.GetDoneDrillingById(doneDrillingId)
    if (doneDrilling and not doneDrilling["EndTime"]):
        print("========= Not Hand ===============================")
        DBQO.UpdateDoneDrillingEndTime(doneDrillingId, datetime.now())
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
    drillings = DBQO.GetCheckTasksTimersDrillings()
    print(drillings)
    for drilling in drillings:
        timeRemaining = CalcTasksTimeRemaining(
            drilling["TimeLimit"], drilling["StartTime"])
        print(timeRemaining)
        threading.Timer(CalcTasksTimeRemaining(
            drilling["TimeLimit"], drilling["StartTime"]), DrillingEndTimeHandler, args={drilling["Id"]}).start()
        print(drilling["TimeLimit"], drilling["StartTime"], drilling["Id"])
    print("[ END ]: OnRestartServerCheckTasksTimers")


OnRestartServerCheckTasksTimers()


UPLOAD_FOLDER = "C:/Coding/Web/VIPonyata/client/public"


@current_app.route("/api/upload", methods=["POST"])
def fileUpload():
    target = os.path.join(UPLOAD_FOLDER, "img")
    if not os.path.isdir(target):
        os.mkdir(target)
    print("==========================================================")
    print("welcome to upload`")
    print(len(request.files))
    if (len(request.files) == 0):
        return jsonify("img/Test.png")
    file = request.files["file"]
    if file and file.filename:
        filename = secure_filename(file.filename)
        destination = "/".join([target, filename])
        file.save(destination)
        session["uploadFilePath"] = destination
        response = "img/" + filename
        print("==========================================================")
        return jsonify(response)

    return "Error"


def UpdeteTimersOnRestart():
    pass


#################################################################################
####   Courses   ################################################################
#################################################################################
@current_app.route("/api/courses", methods=["GET"])
@login_required
def getAllCourses():
    # Teacher
    if GetCurrentUserIsTeacher():
        return {"items": DBQT.GetCourses()}

    # Student
    return {"items": DBQS.GetAvailableCourses(GetCurrentUserId())}


@current_app.route("/api/courses/<id>", methods=["GET"])
@login_required
def getLessonsByCourseId(id):
    # Teacher
    if GetCurrentUserIsTeacher():
        if course := DBQT.GetCourseById(id):
            return {"course": course, "items": DBQT.GetLessonsByCourseId(id)}

    # Student
    elif course := DBQS.GetCourseById(id, GetCurrentUserId()):
        return {"course": course, "items": DBQS.GetLessonsByCourseId(id, GetCurrentUserId())}

    return {"course": None, "items": None}, 403


#################################################################################
####   Lessons   ################################################################
#################################################################################
@current_app.route("/api/lessons/<id>", methods=["GET"])
@login_required
def getLessonActivities(id):  # TODO add assessment and hieroglyph
    # Teacher
    if GetCurrentUserIsTeacher():
        if lesson := DBQT.GetLessonById(id):
            drilling = DBQT.GetDrillingByLessonId(id)
            #doneDrillings = DB.GetTableJson("donedrillings", where=f"DrillingId='{drilling['Id']}' AND EndTime IS NOT NULL ORDER BY TryNumber") if drilling else None
            #if drilling: drilling["tries"] = doneDrillings

            #assesment = GetAssessmentByLessonId(id)
            #hieroglyph = GetHieroglyphByLessonId(id)

            return {"lesson": lesson, "items": {"drilling": drilling}}

    # Student
    elif lesson := DBQS.GetLessonById(id, GetCurrentUserId()):
        if drilling := DBQS.GetDrillingByLessonId(id, GetCurrentUserId()):
            drilling["tries"] = DBQS.GetDoneDrillingsByDrillingId(drilling['Id'], GetCurrentUserId())

            if drilling["TimeLimit"] and drilling["tries"] and drilling["tries"][-1].get("EndTime") == None:
                drilling["Deadline"] = str(CalcTasksDeadline(drilling["TimeLimit"], drilling["tries"][-1]["StartTime"]))
            else:
                drilling["Deadline"] = None

        # if assessment := GetAssessmentByLessonId(id, GetCurrentUserId()):
        # if hieroglyph := GetHieroglyphByLessonId(id, GetCurrentUserId()):

        return jsonify({"lesson": lesson, "items": {"drilling": drilling, "assessment": {}, "hieroglyph": {}}})

    return {"lesson": None, "items": None}, 403


#################################################################################
####   Drilling   ###############################################################
#################################################################################
@current_app.route("/api/drilling/<id>/newtry", methods=["POST"])
@login_required
def startNewDrillingTry(id):
    if not GetCurrentUserIsStudent():
        return {"result": "You are not student!"}, 403

    if drilling := DBQS.GetDrillingById(id, GetCurrentUserId()):
        doneDrillings = DBQS.GetDoneDrillingsByDrillingId(id, GetCurrentUserId())
        length = len(doneDrillings) if doneDrillings else 0

        if doneDrillings and doneDrillings[-1].get("EndTime") == None:
            return {"result": "Already Exists"}, 409

        DBQS.AddNewDoneDrilling(length + 1, id, GetCurrentUserId())

        if (drilling["TimeLimit"]):
            print("========= Timer Start ===============================")
            doneDrilling = DBQS.GetDoneDrillingsByDrillingId(id, GetCurrentUserId())[-1]
            # DB.GetTableJson(
            #    "donedrillings", where=f"DrillingId='{id}' ORDER BY TryNumber")[-1]
            threading.Timer(StrToTimedelta(drilling["TimeLimit"]).seconds,
                            DrillingEndTimeHandler, args={doneDrilling["Id"]}).start()
        return {"result": f"Created!"}

    return {"result": "You have no access to this lesson!"}, 403


@current_app.route("/api/drilling/<id>/continuetry", methods=["POST"])
@login_required
def continueDrillingTry(id):
    if not GetCurrentUserIsStudent():
        return {"result": "You are not student!"}, 403

    drilling = GetSingleItem(
        DB.GetTablesJson(
            {"drillings": {"elements": "ALL"},
             "userlessons": {}},
            where=f"drillings.Id = '{id}' AND drillings.LessonId = userlessons.LessonId AND userlessons.UserId = '{GetCurrentUserId()}'"))
    if drilling:  # Check if user have access to this lesson
        doneDrillings = DB.GetTableJson(
            "donedrillings", where=f"DrillingId='{id}' ORDER BY TryNumber")

        if doneDrillings and doneDrillings[-1].get("EndTime") == None:
            return {"result": "Already Exists"}

    return {"result": "You have no access to this lesson!"}, 403


@current_app.route("/api/drilling/<id>/endtry", methods=["POST"])
@login_required
def endDrillingTry(id):
    if not GetCurrentUserIsStudent():
        return {"result": "You are not student!"}, 403

    drilling = GetSingleItem(
        DB.GetTablesJson(
            {"drillings": {"elements": "ALL"},
             "userlessons": {}},
            where=f"drillings.Id = '{id}' AND drillings.LessonId = userlessons.LessonId AND userlessons.UserId = '{GetCurrentUserId()}'"))
    if drilling:  # Check if user have access to this lesson
        doneDrillings = DB.GetTableJson(
            "donedrillings", where=f"DrillingId='{id}' ORDER BY TryNumber")

        if doneDrillings and doneDrillings[-1].get("EndTime") == None:
            DrillingEndTimeHandler(doneDrillings[-1]["Id"])
            return {"result": "Closed"}

        return {"result": "Already closed"}

    return {"result": "You have no access to this lesson!"}, 403


@current_app.route("/api/drilling/<id>", methods=["GET"])
@login_required
def getDrillingById(id):
    # Teacher
    if GetCurrentUserIsTeacher():
        drilling = GetSingleItem(
            DB.GetTablesJson(
                {"drillings": {"elements": "ALL"}},
                where=f"drillings.Id = '{id}' AND drillings.LessonId = userlessons.LessonId AND userlessons.UserId = '{GetCurrentUserId()}'"))

    # Student
    drilling = GetSingleItem(
        DB.GetTablesJson(
            {"drillings": {"elements": "ALL"},
             "userlessons": {}},
            where=f"drillings.Id = '{id}' AND drillings.LessonId = userlessons.LessonId AND userlessons.UserId = '{GetCurrentUserId()}'"))
    if drilling:  # Check if user have access to this lesson
        doneDrilling = GetSingleItem(DB.GetTableJson(
            "donedrillings", where=f"DrillingId='{id}' AND EndTime IS NULL"))
        if doneDrilling:
            drilling["try"] = doneDrilling
            drilling["try"]["DoneTasks"] = dict(lambda x: dict(x.split(
                ":")), drilling["try"]["DoneTasks"].split(",")) if drilling["try"]["DoneTasks"] else {}

            if drilling["TimeLimit"]:
                drilling["Deadline"] = str(CalcTasksDeadline(
                    drilling["TimeLimit"], doneDrilling["StartTime"]))
            else:
                drilling["Deadline"] = None

            print("================= Drilling =================")
            tasks = {}
            wordsRU = []
            wordsJP = []
            # Drilling Card
            tasks["drillingcard"] = DB.GetTableJson(
                "drillingcard", where=f"DrillingId='{id}'")
            print("Drilling card:", tasks["drillingcard"])
            if tasks["drillingcard"]:
                # Get Words from dictionary
                for card in tasks['drillingcard']:
                    card["Word"] = GetSingleItem(DB.GetTableJson(
                        "dictionary", where=f"Id='{card['DictionaryId']}'"))
                    wordsRU.append(card["Word"]["RU"])
                    wordsJP.append(card["Word"]["WordJP"])
                #print("Words RU:", wordsRU)
                #print("Words JP:", wordsJP)

                tasksNames = drilling["Tasks"].split(",")

                # Drilling Find Pair
                if "drillingfindpair" in tasksNames:
                    shuffleWordsRU = wordsRU.copy()
                    random.shuffle(shuffleWordsRU)
                    shuffleWordsJP = wordsJP.copy()
                    random.shuffle(shuffleWordsJP)
                    answers = {"WordsRU": [], "WordsJP": []}
                    for word in shuffleWordsRU:
                        answers["WordsRU"].append(shuffleWordsRU.index(word))
                        answers["WordsJP"].append(
                            shuffleWordsJP.index(wordsJP[wordsRU.index(word)]))
                    # print(answers)
                    tasks["drillingfindpair"] = {
                        "WordsRU": shuffleWordsRU, "WordsJP": shuffleWordsJP, "answers": answers}

                # Drilling Scramble
                if "drillingscramble" in tasksNames:
                    shuffleWordsJP = wordsJP.copy()
                    random.shuffle(shuffleWordsJP)
                    chars = []
                    for word in shuffleWordsJP:
                        chars.append(list(word))
                        random.shuffle(chars[-1])
                    #print("SWJP", shuffleWordsJP)
                    #print("Chars", chars)
                    tasks["drillingscramble"] = {
                        "words": shuffleWordsJP, "chars": chars}

                # Drilling Translate
                if "drillingtranslate" in tasksNames:
                    tasks["drillingtranslate"] = {
                        "WordsJP": wordsJP, "WordsRU": wordsRU}

                # Drilling Space
                if "drillingspace" in tasksNames:
                    spaceWords = []
                    for i in range(len(wordsJP)):
                        word = wordsJP[i]
                        if len(word) == 1:
                            spaceWords.append(
                                {"WordJP": word, "WordRU": wordsRU[i], "WordStart": "", "WordEnd": "", "Spaces": 1})
                        elif len(word) == 2:
                            spaceWords.append(
                                {"WordJP": word, "WordRU": wordsRU[i],
                                 "WordStart": "", "WordEnd": word[-1],
                                 "Spaces": 2})
                        else:
                            spaceWords.append(
                                {"WordJP": word, "WordRU": wordsRU[i],
                                 "WordStart": word[0],
                                 "WordEnd": word[-1],
                                 "Spaces": len(word) - 2})
                    tasks["drillingspace"] = {"Words": spaceWords}

            return {"drilling": drilling, "items": tasks}

    return {"drilling": None, "items": None}, 403
