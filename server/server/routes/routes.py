import hashlib
import os
from datetime import datetime

from flask import Blueprint, request, send_from_directory
from flask_login import login_required
from PIL import Image
from werkzeug.utils import secure_filename

from server.models.db_models import Course
from server.log_lib import LogI
from server.routes.funcs import funcs_student as student_funcs
from server.routes.funcs import funcs_teacher as teacher_funcs
from server.routes.routes_utils import UserSelectorFunction

routes_bp = Blueprint("routes", __name__)

UPLOAD_FOLDER = "C:/Coding/Web/VIPonyata/uploads" if os.name == 'nt' else "/home/lm/coding/WEB/VIPonyata/uploads"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

UPLOAD_IMG_FOLDER = "img"
RELATIVE_FOLDER_BASE = "/uploads"


#########################################################################################################################
################ Utils ##################################################################################################
#########################################################################################################################
def get_file_extention(filename):
    return filename.rsplit('.', 1)[1].lower()


def allowed_file(filename):
    return '.' in filename and get_file_extention(filename) in ALLOWED_EXTENSIONS


@routes_bp.route("/uploads/<path:path>")
def get_uploads(path):
    LogI("GetFile: ", path)
    return send_from_directory(UPLOAD_FOLDER, path)


def validate_folder(folder: str):
    if not os.path.isdir(folder):
        os.mkdir(folder)

    return folder


def add_path_to_folders(target: str, relative: str, add: str):
    return validate_folder(f"{target}/{add}"), f"{relative}/{add}"


#########################################################################################################################
################ File Upload ############################################################################################
#########################################################################################################################
@routes_bp.route("/upload/img", methods=["POST"])
def post_img_upload():
    validate_folder(UPLOAD_FOLDER)
    target, relative_folder = add_path_to_folders(UPLOAD_FOLDER, RELATIVE_FOLDER_BASE, UPLOAD_IMG_FOLDER)

    if (len(request.files) == 0):
        return {"message": "Error, No files"}, 400

    img_file = request.files["file"]
    if img_file and img_file.filename and allowed_file(img_file.filename):
        image = Image.open(img_file)
        image = image.convert('RGBA')

        time_str = datetime.now().strftime("%Y%m%d%H%M%S").encode()

        target, relative_folder = add_path_to_folders(target, relative_folder,
                                                      hashlib.blake2b(key=time_str, digest_size=1).hexdigest())
        target, relative_folder = add_path_to_folders(target, relative_folder,
                                                      hashlib.blake2s(key=time_str, digest_size=1).hexdigest())

        filename = secure_filename(hashlib.sha512(time_str).hexdigest())
        filename += "." + "webp"

        destination = "/".join([target, filename])
        while os.path.exists(destination):
            time_str = datetime.now().strftime("%Y%m%d%H%M%S").encode()
            filename = secure_filename(hashlib.sha512(time_str).hexdigest())
            filename += "." + "webp"
            destination = "/".join([target, filename])

        image.save(f'{destination}', 'webp')

        response = relative_folder + "/" + filename
        return {"filename": response}

    return {"message": "Error"}, 500


@routes_bp.route("/test", methods=["GET"])
def get_test_some_things():
    return {"test": "test", "val": 10}


#########################################################################################################################
################ Course #################################################################################################
#########################################################################################################################
@routes_bp.route("/courses", methods=["GET"])
@login_required
def get_all_courses():
    return UserSelectorFunction(teacher_funcs.get_all_courses, student_funcs.get_all_courses)


@routes_bp.route("/courses", methods=["POST"])
@login_required
def create_course():
    return UserSelectorFunction(teacher_funcs.create_course, None)


@routes_bp.route("/courses/<id>", methods=["GET"])
@login_required
def get_lessons_by_course_id(id):
    return UserSelectorFunction(teacher_funcs.getLessonsByCourseId, student_funcs.getLessonsByCourseId, courseId=id)


#########################################################################################################################
################ Lesson #################################################################################################
#########################################################################################################################
@routes_bp.route("/lessons/<id>", methods=["GET"])
@login_required
def get_lesson_activities(id):
    return UserSelectorFunction(teacher_funcs.getLessonActivities, student_funcs.getLessonActivities, lessonId=id)


@routes_bp.route("/lessons/<course_id>", methods=["POST"])
@login_required
def create_lesson(course_id):
    return UserSelectorFunction(teacher_funcs.create_lesson, None, course_id=course_id)


#########################################################################################################################
################ Drilling ###############################################################################################
#########################################################################################################################
@routes_bp.route("/drilling/<id>/newtry", methods=["POST"])
@login_required
def start_new_drilling_try(id):
    return UserSelectorFunction(None, student_funcs.DrillingFuncs.StartNewTry, activityId=id)


@routes_bp.route("/drilling/<id>/continuetry", methods=["POST"])
@login_required
def continue_drilling_try(id):
    return UserSelectorFunction(None, student_funcs.DrillingFuncs.ContinueTry, activityId=id)


@routes_bp.route("/drilling/<id>/endtry", methods=["POST"])
@login_required
def end_drilling_try(id):
    return UserSelectorFunction(None, student_funcs.DrillingFuncs.EndTry, activityId=id)


@routes_bp.route("/drilling/<id>/newdonetask", methods=["POST"])
@login_required
def add_drilling_new_done_tasks(id):
    return UserSelectorFunction(None, student_funcs.DrillingFuncs.AddNewDoneTasks, activityId=id)


@routes_bp.route("/drilling/<id>", methods=["GET"])
@login_required
def get_drilling_by_id(id):
    return UserSelectorFunction(teacher_funcs.DrillingFuncs.GetById, student_funcs.DrillingFuncs.GetById, activityId=id)


@routes_bp.route("/drilling/<lesson_id>", methods=["POST"])
@login_required
def create_drilling(lesson_id):
    return UserSelectorFunction(teacher_funcs.DrillingFuncs.create, None, lesson_id=lesson_id)


#########################################################################################################################
################ Hieroglyph #############################################################################################
#########################################################################################################################
@routes_bp.route("/hieroglyph/<id>/newtry", methods=["POST"])
@login_required
def start_new_hieroglyph_try(id):
    return UserSelectorFunction(None, student_funcs.HieroglyphFuncs.StartNewTry, activityId=id)


@routes_bp.route("/hieroglyph/<id>/continuetry", methods=["POST"])
@login_required
def continue_hieroglyph_try(id):
    return UserSelectorFunction(None, student_funcs.HieroglyphFuncs.ContinueTry, activityId=id)


@routes_bp.route("/hieroglyph/<id>/endtry", methods=["POST"])
@login_required
def end_hieroglyph_try(id):
    return UserSelectorFunction(None, student_funcs.HieroglyphFuncs.EndTry, activityId=id)


@routes_bp.route("/hieroglyph/<id>/newdonetask", methods=["POST"])
@login_required
def add_hieroglyph_new_done_tasks(id):
    return UserSelectorFunction(None, student_funcs.HieroglyphFuncs.AddNewDoneTasks, activityId=id)


@routes_bp.route("/hieroglyph/<id>", methods=["GET"])
@login_required
def get_hieroglyph_by_id(id):
    return UserSelectorFunction(teacher_funcs.HieroglyphFuncs.GetById,
                                student_funcs.HieroglyphFuncs.GetById,
                                activityId=id)


@routes_bp.route("/hieroglyph/<lesson_id>", methods=["POST"])
@login_required
def create_hieroglyph(lesson_id):
    return UserSelectorFunction(teacher_funcs.HieroglyphFuncs.create, None, lesson_id=lesson_id)


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
@routes_bp.route("/assessment/<id>/newtry", methods=["POST"])
@login_required
def start_new_assessment_try(id):
    return UserSelectorFunction(None, student_funcs.AssessmentFuncs.StartNewTry, activityId=id)


@routes_bp.route("/assessment/<id>/continuetry", methods=["POST"])
@login_required
def continue_assessment_try(id):
    return UserSelectorFunction(None, student_funcs.AssessmentFuncs.ContinueTry, activityId=id)


@routes_bp.route("/assessment/<id>/endtry", methods=["POST"])
@login_required
def end_assessment_try(id):
    return UserSelectorFunction(None, student_funcs.AssessmentFuncs.EndTry, activityId=id)


@routes_bp.route("/assessment/<id>/newdonetasks", methods=["POST"])
@login_required
def add_assessment_new_done_tasks(id):
    return UserSelectorFunction(None, student_funcs.AssessmentFuncs.AddNewDoneTasks, activityId=id)


@routes_bp.route("/assessment/<id>", methods=["GET"])
@login_required
def get_assessment_by_id(id):
    return UserSelectorFunction(teacher_funcs.AssessmentFuncs.GetById,
                                student_funcs.AssessmentFuncs.GetById,
                                activityId=id)


@routes_bp.route("/assessment/<lesson_id>", methods=["POST"])
@login_required
def create_assessment(lesson_id):
    return UserSelectorFunction(teacher_funcs.AssessmentFuncs.create, None, lesson_id=lesson_id)


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
@routes_bp.route("/dictionary", methods=["GET"])
@login_required
def get_dictionary():
    return UserSelectorFunction(teacher_funcs.get_dictionary, student_funcs.get_dictionary)


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
@routes_bp.route("/notifications", methods=["GET"])
@login_required
def get_notifications():
    return UserSelectorFunction(teacher_funcs.get_notifications, student_funcs.get_notifications)
