from flask import Blueprint, send_from_directory
from flask_login import login_required                                                                                  # type: ignore

import server.handlers.student as student_funcs
import server.handlers.teacher as teacher_funcs
from server.handlers.common import (ALLOWED_AUDIO_EXTENSIONS, ALLOWED_IMG_EXTENSIONS, UPLOAD_AUDIO_FOLDER,
                                    UPLOAD_FOLDER, UPLOAD_IMG_FOLDER, save_audio, save_img, upload_file)
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


@routes_bp.route("/courses/<int:course_id>", methods=["PATCH"])
@login_required
def update_course(course_id):
    return user_selector_function(teacher_funcs.update_course, None, course_id=course_id)


@routes_bp.route("/courses/<int:course_id>", methods=["DELETE"])
@login_required
def delete_course_by_id(course_id):
    return user_selector_function(teacher_funcs.delete_course_by_id, None, course_id=course_id)


@routes_bp.route("/courses", methods=["POST"])
@login_required
def create_course():
    return user_selector_function(teacher_funcs.create_course, None)


@routes_bp.route("/courses/<int:course_id>", methods=["GET"])
@login_required
def get_lessons_by_course_id(course_id):
    return user_selector_function(teacher_funcs.get_lessons_by_course_id,
                                  student_funcs.get_lessons_by_course_id,
                                  course_id=course_id)


@routes_bp.route("/courses/<int:course_id>/users", methods=["GET"])
@login_required
def get_course_users(course_id):
    return user_selector_function(teacher_funcs.get_course_users, None, course_id=course_id)


@routes_bp.route("/courses/<int:course_id>/users", methods=["POST"])
@login_required
def add_or_remove_user_from_course(course_id):
    return user_selector_function(teacher_funcs.add_or_remove_user_from_course, None, course_id=course_id)


#########################################################################################################################
################ Lesson #################################################################################################
#########################################################################################################################
@routes_bp.route("/lessons/<int:lesson_id>", methods=["GET"])
@login_required
def get_lesson_activities(lesson_id):
    return user_selector_function(teacher_funcs.get_lesson_activities,
                                  student_funcs.get_lesson_activities,
                                  lesson_id=lesson_id)


@routes_bp.route("/lessons/<int:course_id>", methods=["POST"])
@login_required
def create_lesson(course_id):
    return user_selector_function(teacher_funcs.create_lesson, None, course_id=course_id)


@routes_bp.route("/lessons/<int:lesson_id>/users", methods=["GET"])
@login_required
def get_lesson_users(lesson_id):
    return user_selector_function(teacher_funcs.get_lesson_users, None, lesson_id=lesson_id)


@routes_bp.route("/lessons/<int:lesson_id>", methods=["PATCH"])
@login_required
def update_lesson(lesson_id):
    return user_selector_function(teacher_funcs.update_lesson, None, lesson_id=lesson_id)


@routes_bp.route("/lessons/<int:lesson_id>", methods=["DELETE"])
@login_required
def delete_lesson_by_id(lesson_id):
    return user_selector_function(teacher_funcs.delete_lesson_by_id, None, lesson_id=lesson_id)


@routes_bp.route("/lessons/<int:lesson_id>/users", methods=["POST"])
@login_required
def add_or_remove_user_from_lesson(lesson_id):
    return user_selector_function(teacher_funcs.add_or_remove_user_from_lesson, None, lesson_id=lesson_id)


#########################################################################################################################
################ Drilling ###############################################################################################
#########################################################################################################################
@routes_bp.route("/drilling/<int:activity_id>/newtry", methods=["POST"])
@login_required
def start_new_drilling_try(activity_id):
    return user_selector_function(None, student_funcs.DrillingHandlers.start_new_try, activity_id=activity_id)


@routes_bp.route("/drilling/<int:activity_id>/continuetry", methods=["POST"])
@login_required
def continue_drilling_try(activity_id):
    return user_selector_function(None, student_funcs.DrillingHandlers.continue_try, activity_id=activity_id)


@routes_bp.route("/drilling/<int:activity_id>/endtry", methods=["POST"])
@login_required
def end_drilling_try(activity_id):
    return user_selector_function(None, student_funcs.DrillingHandlers.end_try, activity_id=activity_id)


@routes_bp.route("/drilling/<int:activity_id>/newdonetask", methods=["POST"])
@login_required
def add_drilling_new_done_tasks(activity_id):
    return user_selector_function(None, student_funcs.DrillingHandlers.add_new_done_tasks, activity_id=activity_id)


@routes_bp.route("/drilling/<int:activity_id>", methods=["GET"])
@login_required
def get_drilling_by_id(activity_id):
    return user_selector_function(teacher_funcs.DrillingHandlers.get_by_id,
                                  student_funcs.DrillingHandlers.get_by_id,
                                  activity_id=activity_id)


@routes_bp.route("/drilling/<int:activity_id>", methods=["PATCH"])
@login_required
def update_drilling(activity_id):
    return user_selector_function(teacher_funcs.DrillingHandlers.update, None, activity_id=activity_id)


@routes_bp.route("/drilling/<int:activity_id>", methods=["DELETE"])
@login_required
def delete_drilling_by_id(activity_id):
    return user_selector_function(teacher_funcs.DrillingHandlers.delete_by_id, None, activity_id=activity_id)


@routes_bp.route("/drilling/<int:lesson_id>", methods=["POST"])
@login_required
def create_drilling(lesson_id):
    return user_selector_function(teacher_funcs.DrillingHandlers.create, None, lesson_id=lesson_id)


#########################################################################################################################
################ Hieroglyph #############################################################################################
#########################################################################################################################
@routes_bp.route("/hieroglyph/<int:activity_id>/newtry", methods=["POST"])
@login_required
def start_new_hieroglyph_try(activity_id):
    return user_selector_function(None, student_funcs.HieroglyphHandlers.start_new_try, activity_id=activity_id)


@routes_bp.route("/hieroglyph/<int:activity_id>/continuetry", methods=["POST"])
@login_required
def continue_hieroglyph_try(activity_id):
    return user_selector_function(None, student_funcs.HieroglyphHandlers.continue_try, activity_id=activity_id)


@routes_bp.route("/hieroglyph/<int:activity_id>/endtry", methods=["POST"])
@login_required
def end_hieroglyph_try(activity_id):
    return user_selector_function(None, student_funcs.HieroglyphHandlers.end_try, activity_id=activity_id)


@routes_bp.route("/hieroglyph/<int:activity_id>/newdonetask", methods=["POST"])
@login_required
def add_hieroglyph_new_done_tasks(activity_id):
    return user_selector_function(None, student_funcs.HieroglyphHandlers.add_new_done_tasks, activity_id=activity_id)


@routes_bp.route("/hieroglyph/<int:activity_id>", methods=["GET"])
@login_required
def get_hieroglyph_by_id(activity_id):
    return user_selector_function(teacher_funcs.HieroglyphHandlers.get_by_id,
                                  student_funcs.HieroglyphHandlers.get_by_id,
                                  activity_id=activity_id)


@routes_bp.route("/hieroglyph/<int:activity_id>", methods=["PATCH"])
@login_required
def update_hieroglyph(activity_id):
    return user_selector_function(teacher_funcs.HieroglyphHandlers.update, None, activity_id=activity_id)


@routes_bp.route("/hieroglyph/<int:activity_id>", methods=["DELETE"])
@login_required
def delete_hieroglyph_by_id(activity_id):
    return user_selector_function(teacher_funcs.HieroglyphHandlers.delete_by_id, None, activity_id=activity_id)


@routes_bp.route("/hieroglyph/<int:lesson_id>", methods=["POST"])
@login_required
def create_hieroglyph(lesson_id):
    return user_selector_function(teacher_funcs.HieroglyphHandlers.create, None, lesson_id=lesson_id)


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
@routes_bp.route("/assessment/<int:activity_id>/donetries", methods=["GET"])
@login_required
def get_assessment_done_tries(activity_id):
    return user_selector_function(teacher_funcs.AssessmentHandlers.get_done_tries,
                                  student_funcs.AssessmentHandlers.get_done_tries,
                                  activity_id=activity_id)


@routes_bp.route("/assessment/donetries/<int:done_try_id>", methods=["GET"])
@login_required
def get_assessment_done_try(done_try_id):
    return user_selector_function(teacher_funcs.AssessmentHandlers.get_done_try,
                                  student_funcs.AssessmentHandlers.get_done_try,
                                  done_try_id=done_try_id)


@routes_bp.route("/assessment/donetries/<int:done_try_id>", methods=["PATCH"])
@login_required
def set_assessment_done_try_checks(done_try_id):
    return user_selector_function(teacher_funcs.AssessmentHandlers.set_done_try_check, None, done_try_id=done_try_id)


@routes_bp.route("/assessment/<int:activity_id>/newtry", methods=["POST"])
@login_required
def start_new_assessment_try(activity_id):
    return user_selector_function(None, student_funcs.AssessmentHandlers.start_new_try, activity_id=activity_id)


@routes_bp.route("/assessment/<int:activity_id>/continuetry", methods=["POST"])
@login_required
def continue_assessment_try(activity_id):
    return user_selector_function(None, student_funcs.AssessmentHandlers.continue_try, activity_id=activity_id)


@routes_bp.route("/assessment/<int:activity_id>/endtry", methods=["POST"])
@login_required
def end_assessment_try(activity_id):
    return user_selector_function(None, student_funcs.AssessmentHandlers.end_try, activity_id=activity_id)


@routes_bp.route("/assessment/<int:activity_id>/newdonetasks", methods=["POST"])
@login_required
def add_assessment_new_done_tasks(activity_id):
    return user_selector_function(None, student_funcs.AssessmentHandlers.add_new_done_tasks, activity_id=activity_id)


@routes_bp.route("/assessment/<int:activity_id>", methods=["GET"])
@login_required
def get_assessment_by_id(activity_id):
    return user_selector_function(teacher_funcs.AssessmentHandlers.get_by_id,
                                  student_funcs.AssessmentHandlers.get_by_id,
                                  activity_id=activity_id)


@routes_bp.route("/assessment/<int:activity_id>", methods=["PATCH"])
@login_required
def update_assessment(activity_id):
    return user_selector_function(teacher_funcs.AssessmentHandlers.update, None, activity_id=activity_id)


@routes_bp.route("/assessment/<int:activity_id>", methods=["DELETE"])
@login_required
def delete_assessment_by_id(activity_id):
    return user_selector_function(teacher_funcs.AssessmentHandlers.delete_by_id, None, activity_id=activity_id)


@routes_bp.route("/assessment/<int:lesson_id>", methods=["POST"])
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


@routes_bp.route("/dictionary/count", methods=["GET"])
@login_required
def get_dictionary_count():
    return user_selector_function(None, student_funcs.get_dictionary_count)


@routes_bp.route("/dictionary", methods=["POST"])
@login_required
def create_dictionary():
    return user_selector_function(teacher_funcs.create_dictionary, None)


@routes_bp.route("/dictionary/clear", methods=["DELETE"])
@login_required
def clear_dictionary():
    return user_selector_function(teacher_funcs.clear_dictionary, None)


@routes_bp.route("/dictionary/<int:id>/img", methods=["POST"])
@login_required
def add_img_to_dictionary(id):
    return user_selector_function(teacher_funcs.add_img_to_dictionary, student_funcs.add_img_to_dictionary, id=id)


@routes_bp.route("/dictionary/<int:id>/association", methods=["POST"])
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


@routes_bp.route("/notifications/read", methods=["POST"])
@login_required
def mark_notifications_as_read():
    return user_selector_function(teacher_funcs.mark_notifications_as_read, student_funcs.mark_notifications_as_read)
