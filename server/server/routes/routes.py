import os
import hashlib
from datetime import datetime, time, timedelta

from flask import Blueprint, request
from flask_login import login_required
from werkzeug.utils import secure_filename

from .. import DBsession
from ..ApiExceptions import InvalidAPIUsage
from ..db_models import Course
from .funcs import funcs_student as student_funcs
from .funcs import funcs_teacher as teacher_funcs
from .routes_utils import UserSelectorFunction
from ..log_lib import LogI

routes_bp = Blueprint("routes", __name__)

#UPLOAD_FOLDER = "C:/Coding/Web/VIPonyata/client/public"
UPLOAD_FOLDER = "/home/lm/coding/WEB/VIPonyata/client/public"

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def get_file_extention(filename):
    return filename.rsplit('.', 1)[1].lower()


def allowed_file(filename):
    return '.' in filename and get_file_extention(filename) in ALLOWED_EXTENSIONS


@routes_bp.route("/upload", methods=["POST"])
def fileUpload():
    relative_folder = "img/dictionary"
    target = os.path.join(UPLOAD_FOLDER, relative_folder)
    if not os.path.isdir(target):
        os.mkdir(target)

    LogI("==========================================================")
    LogI("Welcome to upload")
    LogI("FilesCount: ", len(request.files))
    LogI("Request files: ", request.files)
    if (len(request.files) == 0):
        return {"message": "Error, No files"}, 400
    file = request.files["file"]
    if file and file.filename and allowed_file(file.filename):
        LogI("file: ", file)
        filename = secure_filename(hashlib.sha512(datetime.now().strftime("%Y%m%d%H%M%S").encode()).hexdigest())
        filename += "." + get_file_extention(file.filename)

        destination = "/".join([target, filename])
        if not os.path.exists(destination):
            file.save(destination)
        #session["uploadFilePath"] = destination
        response = relative_folder + "/" + filename
        LogI("==========================================================")
        return {"meta": {"filename": response}}

    return {"message": "Error"}, 500


@routes_bp.route("/test", methods=["GET"])
def testSomeThings():
    return {"test": "test", "val": 10}
    raise InvalidAPIUsage("Test Error", 400, {"testdata": 10, "other": time(second=10)})
    courses = DBsession().query(Course).all()
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
def getLessonActivities(id):
    return UserSelectorFunction(teacher_funcs.getLessonActivities, student_funcs.getLessonActivities, lessonId=id)


@routes_bp.route("/drilling/<id>/newtry", methods=["POST"])
@login_required
def startNewDrillingTry(id):
    return UserSelectorFunction(None, student_funcs.DrillingFuncs.StartNewTry, activityId=id)


@routes_bp.route("/drilling/<id>/continuetry", methods=["POST"])
@login_required
def continueDrillingTry(id):
    return UserSelectorFunction(None, student_funcs.DrillingFuncs.ContinueTry, activityId=id)


@routes_bp.route("/drilling/<id>/endtry", methods=["POST"])
@login_required
def endDrillingTry(id):
    return UserSelectorFunction(None, student_funcs.DrillingFuncs.EndTry, activityId=id)


@routes_bp.route("/drilling/<id>/newdonetask", methods=["POST"])
@login_required
def addDrillingNewDoneTasks(id):
    return UserSelectorFunction(None, student_funcs.DrillingFuncs.AddNewDoneTasks, activityId=id)


@routes_bp.route("/drilling/<id>", methods=["GET"])
@login_required
def getDrillingById(id):
    return UserSelectorFunction(teacher_funcs.DrillingFuncs.GetById, student_funcs.DrillingFuncs.GetById, activityId=id)


@routes_bp.route("/hieroglyph/<id>/newtry", methods=["POST"])
@login_required
def startNewHieroglyphTry(id):
    return UserSelectorFunction(None, student_funcs.HieroglyphFuncs.StartNewTry, activityId=id)


@routes_bp.route("/hieroglyph/<id>/continuetry", methods=["POST"])
@login_required
def continueHieroglyphTry(id):
    return UserSelectorFunction(None, student_funcs.HieroglyphFuncs.ContinueTry, activityId=id)


@routes_bp.route("/hieroglyph/<id>/endtry", methods=["POST"])
@login_required
def endHieroglyphTry(id):
    return UserSelectorFunction(None, student_funcs.HieroglyphFuncs.EndTry, activityId=id)


@routes_bp.route("/hieroglyph/<id>/newdonetask", methods=["POST"])
@login_required
def addHieroglyphNewDoneTasks(id):
    return UserSelectorFunction(None, student_funcs.HieroglyphFuncs.AddNewDoneTasks, activityId=id)


@routes_bp.route("/hieroglyph/<id>", methods=["GET"])
@login_required
def getHieroglyphById(id):
    return UserSelectorFunction(teacher_funcs.HieroglyphFuncs.GetById,
                                student_funcs.HieroglyphFuncs.GetById,
                                activityId=id)


@routes_bp.route("/assessment/<id>/newtry", methods=["POST"])
@login_required
def startNewAssessmentTry(id):
    return UserSelectorFunction(None, student_funcs.AssessmentFuncs.StartNewTry, activityId=id)


@routes_bp.route("/assessment/<id>/continuetry", methods=["POST"])
@login_required
def continueAssessmentTry(id):
    return UserSelectorFunction(None, student_funcs.AssessmentFuncs.ContinueTry, activityId=id)


@routes_bp.route("/assessment/<id>/endtry", methods=["POST"])
@login_required
def endAssessmentTry(id):
    return UserSelectorFunction(None, student_funcs.AssessmentFuncs.EndTry, activityId=id)


# @routes_bp.route("/assessment/<id>/newdonetask", methods=["POST"])
# @login_required
# def addAssessmentNewDoneTasks(id):
#     return UserSelectorFunction(None, student_funcs.AssessmentFuncs.AddNewDoneTasks, activityId=id)


@routes_bp.route("/assessment/<id>", methods=["GET"])
@login_required
def getAssessmentById(id):
    return UserSelectorFunction(teacher_funcs.AssessmentFuncs.GetById,
                                student_funcs.AssessmentFuncs.GetById,
                                activityId=id)