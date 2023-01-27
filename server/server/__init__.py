from datetime import datetime, time, timedelta

from flask import Blueprint, json
from flask_login import LoginManager
from sqlalchemy.ext.declarative import DeclarativeMeta

from .db_models import CreateSessionFromJsonFile

DBsession = CreateSessionFromJsonFile()
login_manager = LoginManager()

base_blueprint = Blueprint("base", __name__, url_prefix="/api")


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            if hasattr(obj, '__json__'):
                return obj.__json__()
            data = {}
            for column in obj.__table__.columns:
                data[column.name] = getattr(obj, column.name)
            return data
        if type(obj) == timedelta or type(obj) == time or type(obj) == datetime:
            return str(obj)

        return json.JSONEncoder.default(self, obj)
