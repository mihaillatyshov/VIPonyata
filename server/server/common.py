from datetime import datetime, time, timedelta

from flask import Blueprint, json
from flask.json.provider import DefaultJSONProvider
from flask_login import LoginManager                                                                                    # type: ignore
from sqlalchemy.ext.declarative import DeclarativeMeta
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import DDL


class DBHandler:
    session: sessionmaker

    def init(self, session: sessionmaker):
        self.session = session

    def __call__(self):
        return self.session()

    def begin(self):
        return self.session.begin()

    def create_custom_trigers(self):
        with self() as session:
            session.execute(
                DDL("""
                    CREATE OR REPLACE TRIGGER check_unique_active_record_in_drilling_tries
                    BEFORE INSERT ON drilling_tries
                    FOR EACH ROW
                    BEGIN
                        IF (NEW.end_datetime IS NULL) THEN
                            IF EXISTS (
                                SELECT 1
                                FROM drilling_tries
                                WHERE base_id = NEW.base_id
                                AND user_id = NEW.user_id
                                AND end_datetime IS NULL
                            ) THEN
                                SIGNAL SQLSTATE '45000'
                                SET MESSAGE_TEXT = 'Ошибка: Активная запись с таким base_id и user_id уже существует.';
                            END IF;
                        END IF;
                    END
                    """), )

            session.execute(
                DDL("""
                    CREATE OR REPLACE TRIGGER check_unique_active_record_in_hieroglyph_tries
                    BEFORE INSERT ON hieroglyph_tries
                    FOR EACH ROW
                    BEGIN
                        IF (NEW.end_datetime IS NULL) THEN
                            IF EXISTS (
                                SELECT 1
                                FROM hieroglyph_tries
                                WHERE base_id = NEW.base_id
                                AND user_id = NEW.user_id
                                AND end_datetime IS NULL
                            ) THEN
                                SIGNAL SQLSTATE '45000'
                                SET MESSAGE_TEXT = 'Ошибка: Активная запись с таким base_id и user_id уже существует.';
                            END IF;
                        END IF;
                    END
                    """), )

            session.execute(
                DDL("""
                    CREATE OR REPLACE TRIGGER check_unique_active_record_in_assessment_tries
                    BEFORE INSERT ON assessment_tries
                    FOR EACH ROW
                    BEGIN
                        IF (NEW.end_datetime IS NULL) THEN
                            IF EXISTS (
                                SELECT 1
                                FROM assessment_tries
                                WHERE base_id = NEW.base_id
                                AND user_id = NEW.user_id
                                AND end_datetime IS NULL
                            ) THEN
                                SIGNAL SQLSTATE '45000'
                                SET MESSAGE_TEXT = 'Ошибка: Активная запись с таким base_id и user_id уже существует.';
                            END IF;
                        END IF;
                    END
                    """), )


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
