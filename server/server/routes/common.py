from server.routes.routes_utils import on_restart_server_check_tasks_timers


def on_start_app():
    on_restart_server_check_tasks_timers()
