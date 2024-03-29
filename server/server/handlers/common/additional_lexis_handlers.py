

class LexisTaskName:
    CARD = "card"
    FINDPAIR = "findpair"
    SCRAMBLE = "scramble"
    TRANSLATE = "translate"
    SPACE = "space"


LexisTaskNameList = [
    value for name, value in vars(LexisTaskName).items()
    if not callable(getattr(LexisTaskName, name)) and not name.startswith("__")
]
