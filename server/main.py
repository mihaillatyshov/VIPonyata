from server import createApp
from flask_cors import CORS

app = createApp()
CORS(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0")