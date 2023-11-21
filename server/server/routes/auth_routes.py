from flask import Blueprint, request
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

import server.queries.OtherDBqueries as DBQO
from server.common import login_manager
from server.models.db_models import User
from server.models.FlaskUser import FlaskUser
from server.models.user import (UserAvatarUpdateReq, UserDataUpdateReq,
                                UserLoginReq, UserPasswordUpdateReq,
                                UserRegisterReq)
from server.models.utils import validate_req
from server.routes.routes_utils import get_current_user_id

auth_bp = Blueprint("auth", __name__)


@login_manager.user_loader
def load_user(user_id):
    if user_id is not None:
        return FlaskUser().FromDB(user_id)
    return None


def get_current_user_data() -> dict:
    data = {}
    if (current_user.get_id() != None):
        data = {
            "id": current_user.GetId(),
            "name": current_user.GetName(),
            "nickname": current_user.GetNickname(),
            "level": current_user.GetLevel(),
            "avatar": current_user.GetAvatar(),
            "form": current_user.GetForm()
        }

    return data


@auth_bp.route("/islogin", methods=["GET"])
def islogin():
    data = get_current_user_data()
    return {"isAuth": True if data else None, "userData": data}


@auth_bp.route("/login", methods=["POST"])
def login():
    user_req_data = validate_req(UserLoginReq, request.json, 422, "Пожалуйста, заполните все поля")

    user = FlaskUser().FromDB(user_req_data.nickname)
    if user.IsExists() and check_password_hash(user.GetPassword(), user_req_data.password):
        login_user_is_auth = login_user(user, remember=True)
        return {"isAuth": login_user_is_auth, "userData": get_current_user_data()}

    return {"message": "Неправильный логин или пароль"}, 422


@auth_bp.route("/register", methods=["POST"])
def register():
    user_req_data = validate_req(UserRegisterReq, request.json, 422, "Пожалуйста, заполните все поля")

    check_user = FlaskUser().FromDB(user_req_data.nickname)
    if check_user.IsExists():
        return {"message": "Этот никнейм уже занят"}, 422

    hash_pwd = generate_password_hash(user_req_data.password1)
    DBQO.create_new_user(user_req_data, hash_pwd)

    user = FlaskUser().FromDB(user_req_data.nickname)
    if user.IsExists():
        login_user_is_auth = login_user(user, remember=True)
        return {"isAuth": login_user_is_auth, "userData": get_current_user_data()}

    return {"message": "Не удалось создать пользователя"}, 422


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return {"message": "User Logout!"}


@auth_bp.route("/profile/data", methods=["PATCH"])
@login_required
def user_data_update():
    user_req_data = validate_req(UserDataUpdateReq, request.json, 422, "Пожалуйста, заполните все поля")
    DBQO.user_data_update(user_req_data, get_current_user_id())

    return {"message": "ok"}


@auth_bp.route("/profile/password", methods=["PATCH"])
@login_required
def user_password_update():
    user_req_data = validate_req(UserPasswordUpdateReq, request.json, 422, "Пожалуйста, заполните все поля")
    DBQO.user_password_update(generate_password_hash(user_req_data.password1), get_current_user_id())

    return {"message": "ok"}


@auth_bp.route("/profile/avatar", methods=["POST"])
@login_required
def user_avatar_update():
    user_req_data = validate_req(UserAvatarUpdateReq, request.json, 422, "Проблема с картинкой")
    DBQO.user_avatar_update(user_req_data.url, get_current_user_id())

    return {"message": "ok"}
