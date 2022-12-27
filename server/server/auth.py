import datetime

from flask import abort, current_app, request
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

from . import DB, RL, login_manager
from .User import User


@login_manager.user_loader
def load_user(user_id):
    print("GetUserFromDB")
    if user_id is not None:
        print("user id not None")
        return User().FromDB(user_id)
    print("user id is None")
    return None


def getCurrentUserData() -> dict:
    data = {}
    if (current_user.get_id() != None):                 # type: ignore
        data = {
            "id": current_user.get_id(),                # type: ignore
            "name": current_user.GetName(),             # type: ignore
            "nickname": current_user.GetNickname(),     # type: ignore
            "level": current_user.GetLevel(),           # type: ignore
            "avatar": current_user.GetAvatar(),         # type: ignore
            "form": current_user.GetForm()              # type: ignore
        }

    return data


@current_app.route("/api/islogin", methods=["GET"])
def islogin():
    data = getCurrentUserData()
    return {"isAuth": True if data else None, "userData": data}


@current_app.route("/api/login", methods=["POST"])
def login():
    print(request.data)
    if not request.json:
        abort(400)

    print(request.json)

    nickname = request.json.get("nickname")
    password = request.json.get("password")

    if nickname and password:
        print("Data ok")
        user = User().FromDB(nickname)
        if user.IsExists():
            print("Exist")
            if check_password_hash(user.GetPassword(), password):
                print("login user: ", login_user(user, remember=True))
                return {"isAuth": login_user(user, remember=True), "userData": getCurrentUserData()}

    return {"message": "Wrong nickname or password!"}, 422


@current_app.route("/api/register", methods=["POST"])
def register():
    if not request.json:
        abort(400)

    nickname = request.json.get("nickname")
    password1 = request.json.get("password1")
    password2 = request.json.get("password2")
    name = request.json.get("name")
    birthday = request.json.get("birthday")
    print("Login:")
    print(nickname)
    print(password1)
    print(password2)
    print(name)
    print(birthday)

    if not (nickname or password1 or password2 or name or birthday):
        print("Пожалуйста, заполните все поля")
        return {"message": "Пожалуйста, заполните все поля"}, 422
    elif password1 != password2:
        print("Пароли не совпадают: ", nickname)
        return {"message": "Пароли не совпадают"}, 422
    else:
        user = User().FromDB(nickname)
        if user.IsExists():
            print("Этот никнейм уже занят")
            return {"message": "Этот никнейм уже занят!"}, 422

        hashPwd = generate_password_hash(password1)
        RL.AddUser(nickname, {"password": hashPwd, })
        DB.AddTableElement("users", {
            "Name": name,
            "Nickname": nickname,
            "Birthday": birthday,
            "Registration": str(datetime.datetime.now().date()),
            "Level": 0,
        })

    userData = DB.GetTableJson("users", f"nickname='{nickname}'")[0]
    print("userData", userData)

    return {"userData": userData}, 201


@current_app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return {"message": "User Logout!"}
