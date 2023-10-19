import datetime
import hashlib
import os
from typing import Callable

from flask import request
from PIL import Image
from werkzeug.datastructures import FileStorage

from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.load_config import load_config


def get_uploads_folder_from_config():
    return load_config("config.json")["uploads"]


UPLOAD_FOLDER = get_uploads_folder_from_config()
ALLOWED_IMG_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
ALLOWED_AUDIO_EXTENSIONS = {"mp3"}

UPLOAD_IMG_FOLDER = "img"
UPLOAD_AUDIO_FOLDER = "mp3"
RELATIVE_FOLDER_BASE = "/uploads"


#########################################################################################################################
################ Utils ##################################################################################################
#########################################################################################################################
def get_file_extention(filename):
    return filename.rsplit(".", 1)[-1].lower()


def is_allowed_ext(filename, exts: list[str]):
    return "." in filename and get_file_extention(filename) in exts


def validate_folder(folder: str):
    os.makedirs(folder, exist_ok=True)

    return folder


def add_path_to_folders(target: str, relative: str, add: str):
    return validate_folder(os.path.join(target, add)), os.path.join(relative, add)


def get_file_hash() -> tuple[str, str]:
    result = hashlib.sha512(datetime.datetime.now().strftime("%Y%m%d%H%M%S").encode()).hexdigest()

    folder = result[:2] + "/" + result[2:4]
    return folder + "/" + result[4:], folder


def save_img(in_file: FileStorage, filename: str):
    image = Image.open(in_file)
    image = image.convert("RGBA")
    image.save(filename, "webp")


def save_audio(in_file: FileStorage, filename: str):
    in_file.save(filename, 4096)


def upload_file(upload_folder: str, ext: str, allowed_exts: list[str], save_func: Callable[[FileStorage, str], None]):
    validate_folder(UPLOAD_FOLDER)
    target, relative_folder = add_path_to_folders(UPLOAD_FOLDER, RELATIVE_FOLDER_BASE, upload_folder)

    if (len(request.files) == 0):
        raise InvalidAPIUsage("Error, no files")

    in_file = request.files["file"]

    if in_file and in_file.filename and is_allowed_ext(in_file.filename, allowed_exts):
        filename = ""
        while True:
            hash_filename, folder = get_file_hash()
            filename = hash_filename + ext
            if os.path.exists(target + "/" + filename):
                continue

            validate_folder(target + "/" + folder)
            break

        save_func(in_file, target + "/" + filename)

        return {"filename": relative_folder + "/" + filename}

    return {"message": "Bad file"}, 400
