import pytest
from flask import Flask
from flask.testing import FlaskClient
from pytest_mock import MockerFixture
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

from server.load_config import load_config
from server.models.db_models import Base, create_db_engine, create_db_session
from server.start_server import create_app


@pytest.fixture(autouse=True)
def create_db(mocker: MockerFixture):
    config = load_config("config_test.json")["db"]
    db_config = URL.create(
        config["url"],
        username=config["username"],
        password=config["password"],
        host=config["host"],
        database=config["database"],
    )

    engine = create_db_engine(db_config)

    Base.metadata.create_all(engine)

    session_factory = sessionmaker(bind=engine, expire_on_commit=False)

    mocker.patch("server.models.db_models.create_db_session", return_value=session_factory)

    yield session_factory

    Base.metadata.drop_all(engine)


@pytest.fixture()
def app(create_db):
    app = create_app()

    app.config.update({
        "TESTING": True
    })

    yield app


@pytest.fixture()
def client(app: Flask) -> FlaskClient:
    return app.test_client()


logged_student_data = {
    "name": "test_user_name",
    "nickname": "test_user_nickname",
    "birthday": "2002-03-24",
    "password": "password1234",
}


@pytest.fixture()
def logged_student_client(app: Flask, create_db) -> dict:
    test_client = app.test_client()

    test_client.post("/api/register", json={
        "name": logged_student_data["name"],
        "nickname": logged_student_data["nickname"],
        "birthday": logged_student_data["birthday"],
        "password1": logged_student_data["password"],
        "password2": logged_student_data["password"]
    })

    return test_client


@pytest.fixture()
def runner(app: Flask):
    return app.test_cli_runner()
