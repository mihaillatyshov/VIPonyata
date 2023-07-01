import logging
import click

import os
import datetime

from flask_cors import CORS

from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.start_server import create_app

if not os.path.isdir("./log"):
    os.mkdir("./log")
logging.basicConfig(filename=f'./log/{str(datetime.datetime.now()).replace(":", " ")}.log',
                    level=logging.DEBUG,
                    format='%(asctime)-15s %(name)-5s %(levelname)-8s %(message)s')


class RemoveColorFilter(logging.Filter):
    def filter(self, record):
        if record and record.msg and isinstance(record.msg, str):
            record.msg = click.unstyle(record.msg)
        return True


remove_color_filter = RemoveColorFilter()
logging.getLogger("werkzeug").addFilter(remove_color_filter)

app = create_app()
CORS(app)


@app.errorhandler(InvalidAPIUsage)
def app_error_handler(exception: InvalidAPIUsage):
    return exception.to_dict(), exception.status_code


if __name__ == "__main__":
    app.run(host="0.0.0.0")
