import logging
import logging.handlers
import os

import click
from flask_cors import CORS

from server.start_server import create_app, get_logs_folder_from_config

logs_folder = get_logs_folder_from_config()
os.makedirs(logs_folder, exist_ok=True)
log_file_handler = logging.handlers.TimedRotatingFileHandler(os.path.join(logs_folder, "server.log"), when="midnight")
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)-15s %(name)-5s %(levelname)-8s %(message)s',
                    handlers=[log_file_handler])


class RemoveColorFilter(logging.Filter):
    def filter(self, record):
        if record and record.msg and isinstance(record.msg, str):
            record.msg = click.unstyle(record.msg)
        return True


remove_color_filter = RemoveColorFilter()
logging.getLogger("werkzeug").addFilter(remove_color_filter)


app = create_app()
CORS(app)


if __name__ == "__main__":
    app.run(host="0.0.0.0")
