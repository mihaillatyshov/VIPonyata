class InvalidAPIUsage(Exception):
    status_code: int = 400

    def __init__(self, message: str, status_code=None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        res = dict(self.payload or ())
        res["message"] = self.message
        return res


class InvalidRequestJson(InvalidAPIUsage):
    def __init__(self):
        super().__init__("No json in request!", 400)
