from flask_cors import CORS

from server.start_server import createApp
from server.ApiExceptions import InvalidAPIUsage

app = createApp()
CORS(app)


@app.errorhandler(InvalidAPIUsage)
def appErrorHandler(exception: InvalidAPIUsage):
    return exception.to_dict(), exception.status_code


if __name__ == "__main__":
    app.run(host="0.0.0.0")
