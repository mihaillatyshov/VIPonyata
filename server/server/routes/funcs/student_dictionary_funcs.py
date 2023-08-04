import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import GetCurrentUserId


def get_dictionary() -> dict:
    db_dictionary = DBQS.get_dictionary(GetCurrentUserId())
    result = []
    for dict_item, dict_association in db_dictionary:
        print(dict_item, dict_association)
        if dict_association.img != None:
            dict_item.img = dict_association.img

        result.append(dict_item)

    return {"dictionary": result}
