from flask import Flask

from server.common import CustomJSONEncoder, base_blueprint, login_manager
from server.routes.common import on_start_app


def create_app():
    app = Flask(__name__)
    app.secret_key = "my super duper puper secret key!"                                                                 # TODO add some env var
    app.json_encoder = CustomJSONEncoder

    # app.config.from_object('config.Config')

    login_manager.init_app(app)

    app.register_blueprint(base_blueprint)

    on_start_app()

    return app
