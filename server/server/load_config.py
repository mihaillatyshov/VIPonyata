import json


def load_config(filename: str):
    file = open(filename)
    data = json.load(file)
    file.close()
    return data
