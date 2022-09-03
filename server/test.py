from flask import Flask, current_app, request, abort, jsonify, make_response
from flask_login import LoginManager, current_user, login_user, login_required
from flask_login.utils import logout_user
from RedisUser import RedisUser
from werkzeug.security import check_password_hash, generate_password_hash
import datetime

from RedisLogin import RedisLogin
from DBlib import DataBase

DB = DataBase("localhost", "mihail", "dbnfvbys5", "japan")
RL = RedisLogin(host="localhost")


app = Flask(__name__)
app.secret_key = "my super duper puper secret key!"

login_manager = LoginManager(app)


@login_manager.user_loader
def load_user(user_id):
	return RedisUser().FromDB(user_id, RL)


@app.route("/islogin", methods=["GET"])
def islogin():
	print(current_user.get_id())
	return { "isAuth" : current_user.get_id() != None }


@app.route("/login", methods=["POST"])
def login():
	if not request.json:
		abort(400)
	
	nickname 	= request.json.get("nickname")
	password	= request.json.get("password")
	
	if nickname and password:
		print("Data ok")
		user = RedisUser().FromDB(nickname, RL)
		if user.IsExists():
			print("Exist")
			if check_password_hash(user.GetPassword(), password):
				print("Password")
				#cookieDuration = datetime.timedelta(seconds = 10)
				print("login user: ", login_user(user, remember=True))
				return jsonify({ "isAuth" : True })

	return make_response(jsonify({ "message" : "Wrong nickname or password!" }), 422)


@app.route("/register", methods=["POST"])
def register():
	if not request.json:
		abort(400)

	nickname  	= request.json.get("nickname")
	password1 	= request.json.get("password1")
	password2 	= request.json.get("password2")
	name 		= request.json.get("name")
	birthday 	= request.json.get("birthday")
	print("Login:")
	print(nickname)
	print(password1)
	print(password2)
	print(name)
	print(birthday)

	if not (nickname or password1 or password2 or name or birthday):
		print("Please, fill all fields")
		return (make_response(jsonify({ "message" : "Please, fill all fields" }), 422))
	elif password1 != password2:
		print("Passwords are not equal: ", nickname)
		return (make_response(jsonify({ "message" : "Passwords are not equal" }), 422))
	else:
		# check if user exist
		hashPwd = generate_password_hash(password1)
		RL.AddUser(nickname, { "password" : hashPwd, })
		DB.AddTableElement("users", {
			"Name" 			: name,
			"Nickname" 		: nickname,
			"Birthday" 		: birthday,
			"Registration" 	: str(datetime.datetime.now().date()),
			"Level" 		: 0,
		})

	userData = DB.GetTableJson("users", f"nickname='{nickname}'")[0]
	print("userData", userData)

	return make_response({ "userData" : userData }, 201)


@app.route("/logout", methods=["POST"])
@login_required
def logout():
	logout_user()
	return jsonify({ "message" : "User Logout!" })


if __name__ == "__main__":
    app.run(debug = True)
