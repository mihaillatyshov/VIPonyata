from flask import Flask

from . import CustomJSONEncoder, base_blueprint, login_manager, routes


def create_app():
    app = Flask(__name__)
    app.secret_key = "my super duper puper secret key!"                                                                 # TODO add some env var
    app.json_encoder = CustomJSONEncoder
                                                                                                                        # app.config.from_object('config.Config')

    login_manager.init_app(app)

    app.register_blueprint(base_blueprint)

    routes.on_start_app()

    return app
