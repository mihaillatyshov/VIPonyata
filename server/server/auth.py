from flask import current_app, request, abort, jsonify, make_response
from flask_login import current_user, login_user, login_required, logout_user
from . import login_manager, RL, DB
from .RedisUser import RedisUser
from werkzeug.security import check_password_hash, generate_password_hash
import datetime


@login_manager.user_loader
def load_user(user_id):
	if user_id is not None:
		print("user id not None")
		return RedisUser().FromDB(user_id)
	print("user id is None")
	return None


@current_app.route("/islogin", methods=["GET"])
def islogin():
	print(current_user.get_id())
	return { "isAuth" : current_user.get_id() != None }


@current_app.route("/login", methods=["POST"])
def login():
	if not request.json:
		abort(400)
	
	nickname 	= request.json.get("nickname")
	password	= request.json.get("password")
	
	if nickname and password:
		print("Data ok")
		user = RedisUser().FromDB(nickname)
		if user.IsExists():
			print("Exist")
			if check_password_hash(user.GetPassword(), password):
				print("Password")
				#cookieDuration = datetime.timedelta(seconds = 10)
				print("login user: ", login_user(user, remember=True))
				return jsonify({ "isAuth" : True })

	return make_response(jsonify({ "message" : "Wrong nickname or password!" }), 422)


@current_app.route("/register", methods=["POST"])
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
		print("Пожалуйста, заполните все поля")
		return (make_response(jsonify({ "message" : "Пожалуйста, заполните все поля" }), 422))
	elif password1 != password2:
		print("Пароли не совпадают: ", nickname)
		return (make_response(jsonify({ "message" : "Пароли не совпадают" }), 422))
	else:
		user = RedisUser().FromDB(nickname)
		if user.IsExists():
			print("Этот никнейм уже занят")
			return { "message" : "Этот никнейм уже занят!" }, 422

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


@current_app.route("/logout", methods=["POST"])
@login_required
def logout():
	logout_user()
	return jsonify({ "message" : "User Logout!" })