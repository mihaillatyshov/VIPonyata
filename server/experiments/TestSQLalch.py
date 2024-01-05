import json

from server.log_lib import LogI
from server.models.db_models import Course, create_db_session

DBsession = create_db_session("mysql+mysqlconnector", "mihail", "dbnfvbys5", "localhost", "japan")

courses = DBsession.query(Course).all()

LogI("1: ", courses)
LogI("1: ", json.dumps(courses))
