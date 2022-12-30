from flask import Flask
from flask_login import LoginManager

from .DBlib import CreateSession

DBsession = CreateSession("mysql+mysqlconnector", "mihail", "dbnfvbys5", "localhost", "japan")
login_manager = LoginManager()


def createApp():
    """Construct the core app object."""
    app = Flask(__name__)
    app.secret_key = "my super duper puper secret key!"
    # Application Configuration
    # app.config.from_object('config.Config')

    # Initialize Plugins
    login_manager.init_app(app)

    with app.app_context():
        from . import auth, routes

    return app
