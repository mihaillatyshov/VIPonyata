import pytest
from flask.testing import FlaskClient

from tests.fixtures import logged_student_data


def test_register_ok(client: FlaskClient):
    response = client.post("/api/register", json={
        "name": logged_student_data["name"],
        "nickname": logged_student_data["nickname"],
        "birthday": logged_student_data["birthday"],
        "password1": logged_student_data["password"],
        "password2": logged_student_data["password"]
    })

    assert response.status_code == 200

    assert response.json is not None
    assert response.json["isAuth"] == True
    assert response.json["userData"]["name"] == logged_student_data["name"]
    assert response.json["userData"]["nickname"] == logged_student_data["nickname"]


def test_register_name_empty(client: FlaskClient):
    nickname = "test_user_nickname"
    birthday = "2002-03-24"
    response = client.post("/api/register", json={
        "name": "",
        "nickname": nickname,
        "birthday": birthday,
        "password1": "password1234",
        "password2": "password1234"
    })

    assert response.status_code == 200

    assert response.json is not None
    assert response.json["isAuth"] == True
    assert response.json["userData"]["name"] == name
    assert response.json["userData"]["nickname"] == nickname


def test_logout_ok(logged_student_client: FlaskClient):
    response = logged_student_client.post("/api/logout")

    assert response.status_code == 200
