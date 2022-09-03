from flask import Flask
from flask_login import LoginManager

from .RedisLogin import RedisLogin
from .DBlib import DataBase

DB = DataBase("localhost", "mihail", "dbnfvbys5", "japan")
RL = RedisLogin(host="localhost")
login_manager = LoginManager()

def createApp():
	"""Construct the core app object."""
	app = Flask(__name__)
	app.secret_key = "my super duper puper secret key!"
	# Application Configuration
	#app.config.from_object('config.Config')

	# Initialize Plugins
	login_manager.init_app(app)

	with app.app_context():
		from . import routes
		from . import auth
		

	return app