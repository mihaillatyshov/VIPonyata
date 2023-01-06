from flask_cors import CORS

from server.start_server import createApp

app = createApp()
CORS(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0")
