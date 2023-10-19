from typing import TypedDict

from werkzeug.routing import Map

from server.handlers.student.assessment_handlers import \
    AssessmentHandlers as StudentAssessmentHandlers
from server.handlers.student.assessment_handlers import \
    FinalBossHandlers as StudentFinalBossHandlers
from server.handlers.student.assessment_handlers import \
    IAssessmentHandlers as IStudentAssessmentHandlers
from server.handlers.student.lexis_handlers import \
    DrillingHandlers as StudentDrillingHandlers
from server.handlers.student.lexis_handlers import \
    HieroglyphHandlers as StudentHieroglyphHandlers
from server.handlers.student.lexis_handlers import \
    LexisHandlers as StudentLexisHandlers
from server.handlers.teacher.assessment_handlers import \
    AssessmentHandlers as TeacherAssessmentHandlers
from server.handlers.teacher.assessment_handlers import \
    FinalBossHandlers as TeacherFinalBossHandlers
from server.handlers.teacher.assessment_handlers import \
    IAssessmentHandlers as ITeacherAssessmentHandlers
from server.handlers.teacher.lexis_handlers import \
    DrillingHandlers as TeacherDrillingHandlers
from server.handlers.teacher.lexis_handlers import \
    HieroglyphHandlers as TeacherHieroglyphHandlers
from server.handlers.teacher.lexis_handlers import \
    LexisHandlers as TeacherLexisHandlers
from server.models.db_models import (Assessment, AssessmentTry, Drilling,
                                     DrillingCard, DrillingTry, FinalBoss,
                                     FinalBossTry, Hieroglyph, HieroglyphCard,
                                     HieroglyphTry)


class ActivityDataDict(TypedDict):
    name: str
    db_model: type[Drilling | Hieroglyph | Assessment | FinalBoss]

    try_name: str
    db_model_try: type[DrillingTry | HieroglyphTry | AssessmentTry | FinalBossTry]

    handlers_student: StudentLexisHandlers | IStudentAssessmentHandlers
    handlers_teacher: TeacherLexisHandlers | ITeacherAssessmentHandlers


class LexisDataDict(ActivityDataDict):
    db_model_card: type[DrillingCard | HieroglyphCard]


class AssessmentDataDict(ActivityDataDict):
    pass


class ActivitiesDataList(TypedDict):
    lexis: list[LexisDataDict]
    assessment: list[AssessmentDataDict]


activities_data: ActivitiesDataList = {
    "lexis":
    [{"name": "drilling", "db_model": Drilling, "try_name": "drilling_try",
      "db_model_try": DrillingTry, "db_model_card": DrillingCard,
      "handlers_student": StudentDrillingHandlers,
      "handlers_teacher": TeacherDrillingHandlers},
     {"name": "hieroglyph", "db_model": Hieroglyph, "try_name": "hieroglyph_try",
      "db_model_try": HieroglyphTry, "db_model_card": HieroglyphCard,
      "handlers_student": StudentHieroglyphHandlers,
      "handlers_teacher": TeacherHieroglyphHandlers}],
    "assessment":
    [{"name": "assessment", "db_model": Assessment, "try_name": "assessment_try",
      "db_model_try": AssessmentTry, "handlers_student": StudentAssessmentHandlers,
      "handlers_teacher": TeacherAssessmentHandlers},
     {"name": "final_boss", "db_model": FinalBoss, "try_name": "final_boss_try",
      "db_model_try": FinalBossTry, "handlers_student": StudentFinalBossHandlers,
      "handlers_teacher": TeacherFinalBossHandlers}]}


def check_rule(rule: str, method: str, url_map: Map):
    for url_rule in url_map.iter_rules():
        if url_rule.methods is None:
            continue
        if url_rule.rule == rule and method in url_rule.methods:
            return

    raise AssertionError(f"Rule {rule} with method {method} not found")


def check_activity_routes(url_map: Map):
    for lexis in activities_data["lexis"]:
        check_rule(f"/api/{lexis['name']}/<id>/newtry", "POST", url_map)
        check_rule(f"/api/{lexis['name']}/<id>/continuetry", "POST", url_map)
        check_rule(f"/api/{lexis['name']}/<id>/endtry", "POST", url_map)
        check_rule(f"/api/{lexis['name']}/<id>/newdonetask", "POST", url_map)
        check_rule(f"/api/{lexis['name']}/<id>", "GET", url_map)
        check_rule(f"/api/{lexis['name']}/<lesson_id>", "POST", url_map)

    for assessment in activities_data["assessment"]:
        if assessment["name"] == "final_boss":
            continue
        check_rule(f"/api/{assessment['name']}/<id>/newtry", "POST", url_map)
        check_rule(f"/api/{assessment['name']}/<id>/continuetry", "POST", url_map)
        check_rule(f"/api/{assessment['name']}/<id>/endtry", "POST", url_map)
        check_rule(f"/api/{assessment['name']}/<id>/newdonetasks", "POST", url_map)
        check_rule(f"/api/{assessment['name']}/<id>", "GET", url_map)
        check_rule(f"/api/{assessment['name']}/<lesson_id>", "POST", url_map)
