import datetime

from flask import Blueprint, abort, current_app, request
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

from .. import DBsession, base_blueprint, login_manager
from ..DBlib import User
from ..FlaskUser import FlaskUser
from ..log_lib import LogI

auth_bp = Blueprint("auth", __name__)


@login_manager.user_loader
def load_user(user_id):
    print("GetUserFromDB")
    if user_id is not None:
        print("user id not None")
        return FlaskUser().FromDB(user_id)
    print("user id is None")
    return None


def getCurrentUserData() -> dict:
    data = {}
    if (current_user.get_id() != None):                 # type: ignore
        data = {
            "id": current_user.GetId(),                 # type: ignore
            "name": current_user.GetName(),             # type: ignore
            "nickname": current_user.GetNickname(),     # type: ignore
            "level": current_user.GetLevel(),           # type: ignore
            "avatar": current_user.GetAvatar(),         # type: ignore
            "form": current_user.GetForm()              # type: ignore
        }

    return data


@auth_bp.route("/islogin", methods=["GET"])
def islogin():
    data = getCurrentUserData()
    return {"isAuth": True if data else None, "userData": data}


@auth_bp.route("/login", methods=["POST"])
def login():
    print(request.data)
    if not request.json:
        abort(400)

    print(request.json)

    nickname = request.json.get("nickname")
    password = request.json.get("password")

    if nickname and password:
        print("Data ok")
        user = FlaskUser().FromDB(nickname)
        if user.IsExists():
            print("Exist")
            if check_password_hash(user.GetPassword(), password):
                # print("login user: ", login_user(user, remember=True))
                return {"isAuth": login_user(user, remember=True), "userData": getCurrentUserData()}

    return {"message": "Wrong nickname or password!"}, 422


@auth_bp.route("/register", methods=["POST"])
def register():
    if not request.json:
        abort(400)

    name = request.json.get("name")
    nickname = request.json.get("nickname")
    password1 = request.json.get("password1")
    password2 = request.json.get("password2")
    birthday = request.json.get("birthday")
    LogI("Login:")
    LogI("name:", name)
    LogI("nickname:", nickname)
    LogI("password1:", password1)
    LogI("password2:", password2)
    LogI("birthday", birthday)

    if not (nickname or password1 or password2 or name or birthday):
        LogI("Пожалуйста, заполните все поля")
        return {"message": "Пожалуйста, заполните все поля"}, 422
    elif password1 != password2:
        LogI("Пароли не совпадают: ", nickname)
        return {"message": "Пароли не совпадают"}, 422
    else:
        user = FlaskUser().FromDB(nickname)
        if user.IsExists():
            LogI("Этот никнейм уже занят")
            return {"message": "Этот никнейм уже занят!"}, 422

        hashPwd = generate_password_hash(password1)
        newUser = User(name=name, nickname=nickname, password=hashPwd, birthday=birthday, level=0)
        DBsession.add(newUser)
        DBsession.commit()

    # = DBsession.query(User).filter_by(nickname=nickname).one_or_none()

    if newUserData := FlaskUser().FromDB(nickname).data:
        LogI("userData", newUserData)
        if newUser:
            return {"userData": newUserData}, 201

    return {"message": "Не удалось создать пользователя!"}, 422


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return {"message": "User Logout!"}
