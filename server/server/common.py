from datetime import datetime, time, timedelta

from flask import Blueprint, json
from flask.json.provider import DefaultJSONProvider
from flask_login import LoginManager  # type: ignore
from sqlalchemy.ext.declarative import DeclarativeMeta
from sqlalchemy.orm import sessionmaker


class DBHandler:
    session: sessionmaker

    def init(self, session: sessionmaker):
        self.session = session

    def __call__(self):
        return self.session()

    def begin(self):
        return self.session.begin()


DBsession = DBHandler()
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


class NewCustomJSONEncoder(DefaultJSONProvider):
    @staticmethod
    def default(obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            if hasattr(obj, '__json__'):
                return obj.__json__()
            data = {}
            for column in obj.__table__.columns:
                data[column.name] = getattr(obj, column.name)
            return data
        if isinstance(obj, timedelta) or isinstance(obj, time) or isinstance(obj, datetime):
            return str(obj)

        return DefaultJSONProvider.default(obj)
