
from flask import Blueprint, send_from_directory
from flask_login import login_required  # type: ignore

import server.handlers.student as student_funcs
import server.handlers.teacher as teacher_funcs
from server.handlers.common import (ALLOWED_AUDIO_EXTENSIONS,
                                    ALLOWED_IMG_EXTENSIONS,
                                    UPLOAD_AUDIO_FOLDER, UPLOAD_FOLDER,
                                    UPLOAD_IMG_FOLDER, save_audio, save_img,
                                    upload_file)
from server.routes.routes_utils import user_selector_function

routes_bp = Blueprint("routes", __name__)


#########################################################################################################################
################ File ###################################################################################################
#########################################################################################################################
@routes_bp.route("/uploads/<path:path>", methods=["GET"])
def get_uploads(path):
    return send_from_directory(UPLOAD_FOLDER, path)


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
    return user_selector_function(teacher_funcs.get_all_courses, student_funcs.get_all_courses)


@routes_bp.route("/courses", methods=["POST"])
@login_required
def create_course():
    return user_selector_function(teacher_funcs.create_course, None)


@routes_bp.route("/courses/<id>", methods=["GET"])
@login_required
def get_lessons_by_course_id(id):
    return user_selector_function(teacher_funcs.get_lessons_by_course_id,
                                  student_funcs.get_lessons_by_course_id,
                                  course_id=id)


#########################################################################################################################
################ Lesson #################################################################################################
#########################################################################################################################
@routes_bp.route("/lessons/<id>", methods=["GET"])
@login_required
def get_lesson_activities(id):
    return user_selector_function(
        teacher_funcs.get_lesson_activities, student_funcs.get_lesson_activities, lesson_id=id)


@routes_bp.route("/lessons/<course_id>", methods=["POST"])
@login_required
def create_lesson(course_id):
    return user_selector_function(teacher_funcs.create_lesson, None, course_id=course_id)


#########################################################################################################################
################ Drilling ###############################################################################################
#########################################################################################################################
@routes_bp.route("/drilling/<id>/newtry", methods=["POST"])
@login_required
def start_new_drilling_try(id):
    return user_selector_function(None, student_funcs.DrillingHandlers.start_new_try, activity_id=id)


@routes_bp.route("/drilling/<id>/continuetry", methods=["POST"])
@login_required
def continue_drilling_try(id):
    return user_selector_function(None, student_funcs.DrillingHandlers.continue_try, activity_id=id)


@routes_bp.route("/drilling/<id>/endtry", methods=["POST"])
@login_required
def end_drilling_try(id):
    return user_selector_function(None, student_funcs.DrillingHandlers.end_try, activity_id=id)


@routes_bp.route("/drilling/<id>/newdonetask", methods=["POST"])
@login_required
def add_drilling_new_done_tasks(id):
    return user_selector_function(None, student_funcs.DrillingHandlers.add_new_done_tasks, activity_id=id)


@routes_bp.route("/drilling/<id>", methods=["GET"])
@login_required
def get_drilling_by_id(id):
    return user_selector_function(
        teacher_funcs.DrillingHandlers.GetById, student_funcs.DrillingHandlers.GetById, activityId=id)


@routes_bp.route("/drilling/<lesson_id>", methods=["POST"])
@login_required
def create_drilling(lesson_id):
    return user_selector_function(teacher_funcs.DrillingHandlers.create, None, lesson_id=lesson_id)


#########################################################################################################################
################ Hieroglyph #############################################################################################
#########################################################################################################################
@routes_bp.route("/hieroglyph/<id>/newtry", methods=["POST"])
@login_required
def start_new_hieroglyph_try(id):
    return user_selector_function(None, student_funcs.HieroglyphHandlers.start_new_try, activity_id=id)


@routes_bp.route("/hieroglyph/<id>/continuetry", methods=["POST"])
@login_required
def continue_hieroglyph_try(id):
    return user_selector_function(None, student_funcs.HieroglyphHandlers.continue_try, activity_id=id)


@routes_bp.route("/hieroglyph/<id>/endtry", methods=["POST"])
@login_required
def end_hieroglyph_try(id):
    return user_selector_function(None, student_funcs.HieroglyphHandlers.end_try, activity_id=id)


@routes_bp.route("/hieroglyph/<id>/newdonetask", methods=["POST"])
@login_required
def add_hieroglyph_new_done_tasks(id):
    return user_selector_function(None, student_funcs.HieroglyphHandlers.add_new_done_tasks, activity_id=id)


@routes_bp.route("/hieroglyph/<id>", methods=["GET"])
@login_required
def get_hieroglyph_by_id(id):
    return user_selector_function(teacher_funcs.HieroglyphHandlers.GetById,
                                  student_funcs.HieroglyphHandlers.GetById,
                                  activityId=id)


@routes_bp.route("/hieroglyph/<lesson_id>", methods=["POST"])
@login_required
def create_hieroglyph(lesson_id):
    return user_selector_function(teacher_funcs.HieroglyphHandlers.create, None, lesson_id=lesson_id)


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
@routes_bp.route("/assessment/<id>/newtry", methods=["POST"])
@login_required
def start_new_assessment_try(id):
    return user_selector_function(None, student_funcs.AssessmentHandlers.start_new_try, activity_id=id)


@routes_bp.route("/assessment/<id>/continuetry", methods=["POST"])
@login_required
def continue_assessment_try(id):
    return user_selector_function(None, student_funcs.AssessmentHandlers.continue_try, activity_id=id)


@routes_bp.route("/assessment/<id>/endtry", methods=["POST"])
@login_required
def end_assessment_try(id):
    return user_selector_function(None, student_funcs.AssessmentHandlers.end_try, activity_id=id)


@routes_bp.route("/assessment/<id>/newdonetasks", methods=["POST"])
@login_required
def add_assessment_new_done_tasks(id):
    return user_selector_function(None, student_funcs.AssessmentHandlers.add_new_done_tasks, activity_id=id)


@routes_bp.route("/assessment/<id>", methods=["GET"])
@login_required
def get_assessment_by_id(id):
    return user_selector_function(teacher_funcs.AssessmentHandlers.GetById,
                                  student_funcs.AssessmentHandlers.GetById,
                                  activityId=id)


@routes_bp.route("/assessment/<lesson_id>", methods=["POST"])
@login_required
def create_assessment(lesson_id):
    return user_selector_function(teacher_funcs.AssessmentHandlers.create, None, lesson_id=lesson_id)


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
@routes_bp.route("/dictionary", methods=["GET"])
@login_required
def get_dictionary():
    return user_selector_function(teacher_funcs.get_dictionary, student_funcs.get_dictionary)


@routes_bp.route("/dictionary", methods=["POST"])
@login_required
def create_dictionary():
    return user_selector_function(teacher_funcs.create_dictionary, None)


@routes_bp.route("/dictionary/<int:id>/img", methods=["POST"])
@login_required
def add_img_to_dictionary(id):
    return user_selector_function(teacher_funcs.add_img_to_dictionary, student_funcs.add_img_to_dictionary, id=id)


@routes_bp.route("/dictionary/<id>/association", methods=["POST"])
@login_required
def add_association_to_dictionary(id):
    return user_selector_function(None, student_funcs.add_association_to_dictionary, id=id)


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
@routes_bp.route("/notifications", methods=["GET"])
@login_required
def get_notifications():
    return user_selector_function(teacher_funcs.get_notifications, student_funcs.get_notifications)
