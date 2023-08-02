from server.common import base_blueprint
from server.routes.auth_routes import auth_bp
from server.routes.routes import routes_bp

base_blueprint.register_blueprint(auth_bp)
base_blueprint.register_blueprint(routes_bp)
