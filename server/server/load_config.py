import json


def load_config(filename: str):
    with open(filename, encoding='utf-8') as infile:
        return json.load(infile)
