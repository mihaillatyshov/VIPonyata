from server.routes.routes_utils import OnRestartServerCheckTasksTimers


def on_start_app():
    OnRestartServerCheckTasksTimers()