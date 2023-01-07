from .. import base_blueprint
from .auth_routes import auth_bp
from .routes import routes_bp
from .routes_utils import OnRestartServerCheckTasksTimers

base_blueprint.register_blueprint(auth_bp)
base_blueprint.register_blueprint(routes_bp)


def on_start_app():
    OnRestartServerCheckTasksTimers()
