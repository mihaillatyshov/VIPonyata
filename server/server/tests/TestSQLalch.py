import json
from datetime import datetime, time

from werkzeug.security import generate_password_hash

from ..DBlib import (Course, CreateSession, Dictionary, Drilling, DrillingCard,
                     Lesson, User)
from ..log_lib import LogI

DBsession = CreateSession("mysql+mysqlconnector", "mihail", "dbnfvbys5", "localhost", "japan")

courses = DBsession.query(Course).all()

LogI("1: ", courses)
LogI("1: ", json.dumps(courses))
