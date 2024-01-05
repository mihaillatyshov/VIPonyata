from flask import Flask

from server.activities import check_activity_routes
from server.common import (DBsession, NewCustomJSONEncoder, base_blueprint,
                           login_manager)
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.load_config import load_config
from server.models.db_models import create_db_session_from_json_config_file
from server.routes.common import on_start_app


def get_flask_secret_from_config():
    return load_config("config.json")["flask_secret"]


def get_logs_folder_from_config():
    return load_config("config.json")["logs_folder"]


def create_app():
    DBsession.init(create_db_session_from_json_config_file())

    app = Flask(__name__)
    # app.config.from_object('config.Config')
    app.secret_key = get_flask_secret_from_config()
    app.json_provider_class = NewCustomJSONEncoder
    app.json = NewCustomJSONEncoder(app)

    login_manager.init_app(app)

    app.register_blueprint(base_blueprint)

    @app.errorhandler(InvalidAPIUsage)
    def app_error_handler(exception: InvalidAPIUsage):
        return exception.to_dict(), exception.status_code

    check_activity_routes(app.url_map)

    on_start_app()

    return app
