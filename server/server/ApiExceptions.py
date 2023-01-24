from server.log_lib import LogE


class InvalidAPIUsage(Exception):
    status_code: int = 400

    def __init__(self, message: str, status_code=None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

        LogE(self.message, f"\n            status: {self.status_code}")

    def to_dict(self):
        res = dict(self.payload or ())
        res["message"] = self.message
        return res


class InvalidRequestJson(InvalidAPIUsage):
    def __init__(self):
        super().__init__("No json in request!", 400)


class CourseNotFoundException(InvalidAPIUsage):
    def __init__(self):
        super().__init__("Course not found!", 404)


class LessonNotFoundException(InvalidAPIUsage):
    def __init__(self):
        super().__init__("Lesson not found!", 404)


class LexisNotFoundException(InvalidAPIUsage):
    def __init__(self, type_name: str):
        super().__init__(f"{type_name} not found!", 404)