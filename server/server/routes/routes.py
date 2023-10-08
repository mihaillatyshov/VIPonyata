import hashlib
import os
from datetime import datetime
from typing import Callable

from flask import Blueprint, request, send_from_directory
from flask_login import login_required
from PIL import Image
from werkzeug.datastructures import FileStorage

from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.log_lib import LogI
from server.routes.funcs import funcs_student as student_funcs
from server.routes.funcs import funcs_teacher as teacher_funcs
from server.routes.routes_utils import (UserSelectorFunction, get_uploads_folder_from_config)

routes_bp = Blueprint("routes", __name__)

UPLOAD_FOLDER = get_uploads_folder_from_config()
ALLOWED_IMG_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
ALLOWED_AUDIO_EXTENSIONS = {"mp3"}

UPLOAD_IMG_FOLDER = "img"
UPLOAD_AUDIO_FOLDER = "mp3"
RELATIVE_FOLDER_BASE = "/uploads"


#########################################################################################################################
################ Utils ##################################################################################################
#########################################################################################################################
def get_file_extention(filename):
    return filename.rsplit(".", 1)[-1].lower()


def is_allowed_ext(filename, exts: list[str]):
    return "." in filename and get_file_extention(filename) in exts


@routes_bp.route("/uploads/<path:path>", methods=["GET"])
def get_uploads(path):
    LogI("GetFile: ", path)
    return send_from_directory(UPLOAD_FOLDER, path)


def validate_folder(folder: str):
    os.makedirs(folder, exist_ok=True)

    return folder


def add_path_to_folders(target: str, relative: str, add: str):
    return validate_folder(target + "/" + add), relative + "/" + add


def get_file_hash() -> tuple[str, str]:
    result = hashlib.sha512(datetime.now().strftime("%Y%m%d%H%M%S").encode()).hexdigest()

    folder = result[:2] + "/" + result[2:4]
    return folder + "/" + result[4:], folder


#########################################################################################################################
################ File Upload ############################################################################################
#########################################################################################################################
def save_img(in_file: FileStorage, filename: str):
    image = Image.open(in_file)
    image = image.convert("RGBA")
    image.save(filename, "webp")


def save_audio(in_file: FileStorage, filename: str):
    in_file.save(filename, 4096)
    # with open(in_file, "rb") as fr:
    #     with open(filename, "wb") as fw:
    #         for chunk in iter(lambda: fr.read(4096), b""):
    #             fw.write(chunk)


def upload_file(upload_folder: str, ext: str, allowed_exts: list[str], save_func: Callable[[FileStorage, str], None]):
    validate_folder(UPLOAD_FOLDER)
    target, relative_folder = add_path_to_folders(UPLOAD_FOLDER, RELATIVE_FOLDER_BASE, upload_folder)

    if (len(request.files) == 0):
        raise InvalidAPIUsage("Error, no files")

    in_file = request.files["file"]

    if in_file and in_file.filename and is_allowed_ext(in_file.filename, allowed_exts):
        filename = ""
        while True:
            hash_filename, folder = get_file_hash()
            filename = hash_filename + ext
            if os.path.exists(target + "/" + filename):
                continue

            validate_folder(target + "/" + folder)
            break

        save_func(in_file, target + "/" + filename)

        return {"filename": relative_folder + "/" + filename}

    return {"message": "Bad file"}, 400


@routes_bp.route("/upload/img", methods=["POST"])
@login_required
def post_img_upload():
    return upload_file(UPLOAD_IMG_FOLDER, ".webp", ALLOWED_IMG_EXTENSIONS, save_img)


@routes_bp.route("/upload/audio", methods=["POST"])
@login_required
def post_audio_upload():
    return upload_file(UPLOAD_AUDIO_FOLDER, ".mp3", ALLOWED_AUDIO_EXTENSIONS, save_audio)


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


@routes_bp.route("/dictionary", methods=["POST"])
@login_required
def create_dictionary():
    return UserSelectorFunction(teacher_funcs.create_dictionary, None)


@routes_bp.route("/dictionary/<id>/img", methods=["POST"])
@login_required
def add_img_to_dictionary(id):
    return UserSelectorFunction(teacher_funcs.add_img_to_dictionary, student_funcs.add_img_to_dictionary, id=id)


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
@routes_bp.route("/notifications", methods=["GET"])
@login_required
def get_notifications():
    return UserSelectorFunction(teacher_funcs.get_notifications, student_funcs.get_notifications)
