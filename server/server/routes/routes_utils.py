from flask import Response, make_response
from flask_login import current_user


class InternalServerError(Exception):
    def getResponce(self):
        return {"message": "Something went wrong"}, 500


class SchemaValidationError(Exception):
    def getResponce(self):
        return {"message": "Request is missing required fields"}, 400


def GetCurrentUserId() -> int:
    return current_user.GetId()  # type: ignore


def GetCurrentUserIsTeacher() -> bool:
    return current_user.IsTeacher()  # type: ignore


def GetCurrentUserIsStudent() -> bool:
    return current_user.IsStudent()  # type: ignore


def UserSelectorFunction(teacherFunc, studentFunc, *args, **kwargs) -> Response:
    if GetCurrentUserIsTeacher():
        return teacherFunc(*args, **kwargs)
    if GetCurrentUserIsStudent():
        return studentFunc(*args, **kwargs)

    return make_response({"message": "user error"})
