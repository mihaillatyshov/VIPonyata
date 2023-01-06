import hashlib
import os
import random
import threading
from datetime import datetime, time, timedelta

from flask import Blueprint, abort, jsonify, request, session, make_response
from flask_login import login_required
from werkzeug.utils import secure_filename

from .. import DBsession
from ..DBlib import Course
from ..log_lib import LogI
from ..queries import OtherDBqueries as DBQO
from ..queries import StudentDBqueries as DBQS
from ..queries import TeacherDBqueries as DBQT
from .funcs import student_course_funcs as SCF
from .funcs import teacher_course_funcs as TCF
from .routes_utils import (GetCurrentUserId, GetCurrentUserIsStudent,
                           GetCurrentUserIsTeacher, UserSelectorFunction, InternalServerError)

routes_bp = Blueprint("routes", __name__)


def GetSingleItem(DBRes):
    return DBRes[0] if DBRes else None


def DoneTasksToDict(string: str) -> dict:
    res = {}
    LogI("DoneTasksToDict string:", string)
    if string:
        for task in string.split(","):
            key, val = task.split(":")
            res[key] = val
    LogI("DoneTasksToDict dict:", res)
    return res


def TimeToTimedelta(time: time) -> timedelta:
    return timedelta(hours=time.hour, minutes=time.minute, seconds=time.second, microseconds=time.microsecond)


print("MD5", hashlib.md5("JP1".encode()).hexdigest())


def DrillingEndTimeHandler(doneDrillingId: int):
    doneDrilling = DBQO.GetDoneDrillingById(doneDrillingId)
    if (doneDrilling and not doneDrilling.end_datetime):
        LogI("========= Not Hand ===============================")
        DBQO.UpdateDoneDrillingEndTime(doneDrillingId, datetime.now())
    LogI("========= Timer End ===============================")


def TimeToInt(time: time) -> int:
    return time.second + time.minute * 60 + time.hour * 60 * 60


def CalcTasksDeadline(timeLimit: time, datetimeStart: datetime) -> datetime:
    return datetimeStart + TimeToTimedelta(timeLimit)


def CalcTasksTimeRemainingInt(timeLimit: time, datetimeStart: datetime) -> int:
    timeNow = datetime.now()
    endTime = CalcTasksDeadline(timeLimit, datetimeStart)
    return (endTime - timeNow).seconds if endTime > timeNow else 0


def OnRestartServerCheckTasksTimers():
    LogI("OnRestartServerCheckTasksTimers ==== START ====")
    doneDrillings = DBQO.GetCheckTasksTimersDrillings()
    LogI("OnRestartServerCheckTasksTimers:", doneDrillings)
    for doneDrilling in doneDrillings:
        timeRemaining = CalcTasksTimeRemainingInt(
            doneDrilling.drilling.time_limit, doneDrilling.start_datetime)
        LogI("OnRestartServerCheckTasksTimers:", timeRemaining)
        threading.Timer(timeRemaining, DrillingEndTimeHandler, args={doneDrilling.id}).start()
        LogI("OnRestartServerCheckTasksTimers:", doneDrilling.drilling.time_limit,
             doneDrilling.start_datetime, doneDrilling.id)
    LogI("OnRestartServerCheckTasksTimers ==== END ====")


UPLOAD_FOLDER = "C:/Coding/Web/VIPonyata/client/public"


@routes_bp.route("/upload", methods=["POST"])
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


@routes_bp.route("/test", methods=["GET"])
def testSomeThings():

    courses = DBsession.query(Course).all()
    return {"courses": courses, "datetime": [time(1, 1, 1), timedelta(1, 1, 1), datetime(1, 1, 1, 1, 1, 1)]}


#################################################################################
####   Courses   ################################################################
#################################################################################
@routes_bp.route("/courses", methods=["GET"])
@login_required
def getAllCourses():
    return UserSelectorFunction(TCF.getAllCourses, SCF.getAllCourses)


@routes_bp.route("/courses/<id>", methods=["GET"])
@login_required
def getLessonsByCourseId(id):
    return UserSelectorFunction(TCF.getLessonsByCourseId, SCF.getLessonsByCourseId, courseId=id)


#################################################################################
####   Lessons   ################################################################
#################################################################################
@routes_bp.route("/lessons/<id>", methods=["GET"])
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
            drilling.tries = DBQS.GetDoneDrillingsByDrillingId(
                drilling.id, GetCurrentUserId())  # type: ignore

            if drilling.time_limit and drilling.tries and drilling.tries[-1].end_datetime == None:
                drilling.deadline = CalcTasksDeadline(drilling.time_limit,                                              # type: ignore
                                                      drilling.tries[-1].start_datetime)                                # type: ignore

        # if assessment := GetAssessmentByLessonId(id, GetCurrentUserId()):
        # if hieroglyph := GetHieroglyphByLessonId(id, GetCurrentUserId()):

        return {"lesson": lesson, "items": {"drilling": drilling, "assessment": {}, "hieroglyph": {}}}

    return {"lesson": None, "items": None}, 403


#################################################################################
####   Drilling   ###############################################################
#################################################################################
class DrillingTaskName:
    CARD = "card"
    FINDPAIR = "findpair"
    SCRAMBLE = "scramble"
    TRANSLATE = "translate"
    SPACE = "space"


DrillingTaskNameList = [value for name, value in vars(DrillingTaskName).items() if not callable(
    getattr(DrillingTaskName, name)) and not name.startswith("__")]


@routes_bp.route("/drilling/<id>/newtry", methods=["POST"])
@login_required
def startNewDrillingTry(id):
    LogI('Start New')
    if not GetCurrentUserIsStudent():
        return {"result": "You are not student!"}, 403

    if drilling := DBQS.GetDrillingById(id, GetCurrentUserId()):
        LogI("Drilling ok")
        doneDrillings = DBQS.GetDoneDrillingsByDrillingId(id, GetCurrentUserId())
        length = len(doneDrillings) if doneDrillings else 0
        LogI("Done Drillings length:", length)

        if doneDrillings and doneDrillings[-1].end_datetime == None:
            LogI("Already Exists")
            return {"result": "Already Exists"}, 409

        newDoneDrilling = DBQS.AddNewDoneDrilling(length + 1, id, GetCurrentUserId())
        LogI("AddNewDoneDrilling ok:", length)

        if drilling.time_limit and newDoneDrilling:
            LogI("========= Timer Start ===============================")
            threading.Timer(TimeToTimedelta(drilling.time_limit).seconds,                                               # type: ignore
                            DrillingEndTimeHandler, args={newDoneDrilling.id}).start()
            LogI("Timer created!")
        return {"result": f"Created!"}

    return {"result": "You have no access to this lesson!"}, 403


@routes_bp.route("/drilling/<id>/continuetry", methods=["POST"])
@login_required
def continueDrillingTry(id):
    if not GetCurrentUserIsStudent():
        return {"result": "You are not student!"}, 403

    if DBQS.GetUnfinishedDoneDrillingsByDrillingId(id, GetCurrentUserId()):
        return {"result": "Already Exists, ok"}

    return {"result": "You have no access to this lesson!"}, 403


@routes_bp.route("/drilling/<id>/endtry", methods=["POST"])
@login_required
def endDrillingTry(id):
    if not GetCurrentUserIsStudent():
        return {"result": "You are not student!"}, 403

    if doneDrilling := DBQS.GetUnfinishedDoneDrillingsByDrillingId(id, GetCurrentUserId()):
        DrillingEndTimeHandler(doneDrilling.id)                                                                         # type: ignore
        return {"result": "Closed"}

    return {"result": "Already closed"}, 403


@routes_bp.route("/drilling/<id>/newdonetask", methods=["POST"])
@login_required
def addNewDoneTask(id):
    if not request.json:
        abort(400)

    LogI("newdonetask:", request.json)

    inDoneTasks = request.json.get("done_tasks", {})
    LogI(type(inDoneTasks))
    if inDoneTasks and isinstance(inDoneTasks, dict):
        if doneDrilling := DBQS.GetUnfinishedDoneDrillingsByDrillingId(id, GetCurrentUserId()):
            doneTasks = doneDrilling.getDoneTasksDict()
            for name, value in inDoneTasks.items():
                try:
                    value = int(value)
                except ValueError:
                    # return ToWebJSON({"result": "value not int"}), 403
                    continue
                if isinstance(name, str) and name in DrillingTaskNameList:
                    doneTasks[name] = value
            LogI("ndt e dict:", doneTasks)
            doneTasksStr = ",".join([f"{name}:{value}" for name, value in doneTasks.items()])
            LogI("ndt e str:", doneTasksStr)
            DBQS.SetDoneTaskInDoneDrilling(doneDrilling.id, doneTasksStr)                                               # type: ignore
        return {"result": "ok"}

    return {"result": "something wrong"}, 403


@routes_bp.route("/drilling/<id>", methods=["GET"])
@login_required
def getDrillingById(id):
    # Teacher
    if GetCurrentUserIsTeacher():
        drilling = DBQT.GetDrillingById(id)
        return {"drilling": drilling}

    # Student
    if drilling := DBQS.GetDrillingById(id, GetCurrentUserId()):
        if doneDrilling := DBQS.GetUnfinishedDoneDrillingsByDrillingId(id, GetCurrentUserId()):
            drilling.now_try = doneDrilling                                                                             # type: ignore

            if drilling.time_limit:
                drilling.deadline = CalcTasksDeadline(                                                                  # type: ignore
                    drilling.time_limit, doneDrilling.start_datetime)                                                   # type: ignore

            LogI("================= Drilling =================")
            tasks = {}
            wordsRU = []
            wordsJP = []
            # Drilling Card
            tasks[DrillingTaskName.CARD] = DBQS.GetDrillingCardsByDrillingId(id)
            LogI("Drilling card:", tasks[DrillingTaskName.CARD])
            if tasks[DrillingTaskName.CARD]:
                # Get Words from dictionary
                for card in tasks[DrillingTaskName.CARD]:
                    #card["word"] = DBQS.GetDictionaryByDrillingCardId(card["id"])
                    LogI("Card Word:", card.dictionary)
                    wordsRU.append(card.dictionary.ru)
                    wordsJP.append(card.dictionary.word_jp)
                #print("Words RU:", wordsRU)
                #print("Words JP:", wordsJP)

                tasksNames = drilling.tasks.split(",")
                LogI("tasksNames:", tasksNames)

                # Drilling Find Pair
                if DrillingTaskName.FINDPAIR in tasksNames:
                    shuffleWordsRU = wordsRU.copy()
                    random.shuffle(shuffleWordsRU)
                    shuffleWordsJP = wordsJP.copy()
                    random.shuffle(shuffleWordsJP)
                    answers = {"words_ru": [], "words_jp": []}
                    for word in shuffleWordsRU:
                        answers["words_ru"].append(shuffleWordsRU.index(word))
                        answers["words_jp"].append(shuffleWordsJP.index(wordsJP[wordsRU.index(word)]))
                    # print(answers)
                    tasks[DrillingTaskName.FINDPAIR] = {
                        "words_ru": shuffleWordsRU, "words_jp": shuffleWordsJP, "answers": answers}

                # Drilling Scramble
                if DrillingTaskName.SCRAMBLE in tasksNames:
                    shuffleWordsJP = wordsJP.copy()
                    random.shuffle(shuffleWordsJP)
                    chars = []
                    for word in shuffleWordsJP:
                        chars.append(list(word))
                        random.shuffle(chars[-1])
                    #print("SWJP", shuffleWordsJP)
                    #print("Chars", chars)
                    tasks[DrillingTaskName.SCRAMBLE] = {
                        "words": shuffleWordsJP, "chars": chars}

                # Drilling Translate
                if DrillingTaskName.TRANSLATE in tasksNames:
                    tasks[DrillingTaskName.TRANSLATE] = {
                        "words_jp": wordsJP, "words_ru": wordsRU}

                # Drilling Space
                if DrillingTaskName.SPACE in tasksNames:
                    spaceWords = []
                    for i in range(len(wordsJP)):
                        word = wordsJP[i]
                        if len(word) == 1:
                            spaceWords.append(
                                {"word_jp": word, "word_ru": wordsRU[i], "word_start": "", "word_end": "", "spaces": 1})
                        elif len(word) == 2:
                            spaceWords.append(
                                {"word_jp": word, "word_ru": wordsRU[i],
                                 "word_start": "", "word_end": word[-1],
                                 "spaces": 2})
                        else:
                            spaceWords.append(
                                {"word_jp": word, "word_ru": wordsRU[i],
                                 "word_start": word[0],
                                 "word_end": word[-1],
                                 "spaces": len(word) - 2})
                    tasks[DrillingTaskName.SPACE] = {"words": spaceWords}

            return {"drilling": drilling, "items": tasks}

    return {"drilling": None, "items": None}, 403
