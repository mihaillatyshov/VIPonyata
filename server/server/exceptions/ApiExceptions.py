from server.log_lib import LogE, logger


class InvalidAPIUsage(Exception):
    status_code: int = 400

    def __init__(self, message: str, status_code: int | None = None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

        logger.warn("API exception: " + self.__class__.__name__ + "    CODE: " + str(self.status_code) +
                    "    Message: " + self.message)
        LogE(self.message, f"\n            status: {self.status_code}")

    def to_dict(self):
        res = dict(self.payload or ())
        res["message"] = self.message
        return res


class InvalidRequestJson(InvalidAPIUsage):
    def __init__(self):
        super().__init__("No json in request!", 400)


class CourseNotFoundException(InvalidAPIUsage):
    def __init__(self, course_id: int):
        super().__init__(f"Can't find course with id {course_id}", 404)


class LessonNotFoundException(InvalidAPIUsage):
    def __init__(self, lesson_id: int):
        super().__init__(f"Can't find lesson with id {lesson_id}", 404)


class UserNotFoundException(InvalidAPIUsage):
    def __init__(self, user_id: int):
        super().__init__(f"Can't find user with id {user_id}", 404)


class ActivityNotFoundException(InvalidAPIUsage):
    def __init__(self, type_name: str):
        super().__init__(f"{type_name} not found!", 404)
