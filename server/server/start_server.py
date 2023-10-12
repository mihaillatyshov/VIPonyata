from flask import Flask

from server.common import CustomJSONEncoder, base_blueprint, login_manager
from server.load_config import load_config
from server.routes.common import on_start_app


def get_flask_secret_from_config():
    return load_config("config.json")["flask_secret"]


def get_logs_folder_from_config():
    return load_config("config.json")["logs_folder"]


def create_app():
    app = Flask(__name__)
    # app.config.from_object('config.Config')
    app.secret_key = get_flask_secret_from_config()
    app.json_encoder = CustomJSONEncoder

    login_manager.init_app(app)

    app.register_blueprint(base_blueprint)

    on_start_app()

    return app
