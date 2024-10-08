import logging


class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def LogI(*args):
    print(bcolors.OKGREEN, "[ INFO ]:", *args, bcolors.ENDC)


def LogW(*args):
    print(bcolors.WARNING, "[ WARN ]:", *args, bcolors.ENDC)


def LogE(*args):
    print(bcolors.FAIL, "[ ERROR ]:", *args, bcolors.ENDC)


logger = logging.getLogger("werkzeug")
