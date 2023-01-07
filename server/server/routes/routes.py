import os
from datetime import datetime, time, timedelta

from flask import Blueprint, jsonify, request, session
from flask_login import login_required
from werkzeug.utils import secure_filename

from .. import DBsession
from ..ApiExceptions import InvalidAPIUsage
from ..DBlib import Course
from .funcs import funcs_student as student_funcs
from .funcs import funcs_teacher as teacher_funcs
from .routes_utils import UserSelectorFunction

routes_bp = Blueprint("routes", __name__)


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
    raise InvalidAPIUsage("Test Error", 400, {"testdata": 10, "other": time(second=10)})
    courses = DBsession.query(Course).all()
    return {"courses": courses, "datetime": [time(1, 1, 1), timedelta(1, 1, 1), datetime(1, 1, 1, 1, 1, 1)]}


@routes_bp.route("/courses", methods=["GET"])
@login_required
def getAllCourses():
    return UserSelectorFunction(teacher_funcs.getAllCourses, student_funcs.getAllCourses)


@routes_bp.route("/courses/<id>", methods=["GET"])
@login_required
def getLessonsByCourseId(id):
    return UserSelectorFunction(teacher_funcs.getLessonsByCourseId, student_funcs.getLessonsByCourseId, courseId=id)


@routes_bp.route("/lessons/<id>", methods=["GET"])
@login_required
def getLessonActivities(id):  # TODO add assessment and hieroglyph
    return UserSelectorFunction(teacher_funcs.getLessonActivities, student_funcs.getLessonActivities, lessonId=id)


@routes_bp.route("/drilling/<id>/newtry", methods=["POST"])
@login_required
def startNewDrillingTry(id):
    return UserSelectorFunction(None, student_funcs.startNewDrillingTry, drillingId=id)


@routes_bp.route("/drilling/<id>/continuetry", methods=["POST"])
@login_required
def continueDrillingTry(id):
    return UserSelectorFunction(None, student_funcs.continueDrilingTry, drillingId=id)


@routes_bp.route("/drilling/<id>/endtry", methods=["POST"])
@login_required
def endDrillingTry(id):
    return UserSelectorFunction(None, student_funcs.endDrillingTry, drillingId=id)


@routes_bp.route("/drilling/<id>/newdonetask", methods=["POST"])
@login_required
def addNewDoneTask(id):
    return UserSelectorFunction(None, student_funcs.addNewDoneTask, drillingId=id)


@routes_bp.route("/drilling/<id>", methods=["GET"])
@login_required
def getDrillingById(id):
    return UserSelectorFunction(teacher_funcs.getDrillingById, student_funcs.getDrillingById, drillingId=id)
