from datetime import datetime, time, timedelta

from flask import Blueprint, json
from flask_login import LoginManager
from sqlalchemy.ext.declarative import DeclarativeMeta

from server.models.db_models import create_db_session_from_json_config_file

DBsession = create_db_session_from_json_config_file()
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
        if isinstance(obj, timedelta) or isinstance(obj, time) or isinstance(obj, datetime):
            return str(obj)

        return json.JSONEncoder.default(self, obj)