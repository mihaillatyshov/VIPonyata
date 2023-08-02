import json


def load_config(filename: str):
    infile = open(filename)
    data = json.load(infile)
    infile.close()
    return data
