line = ("aa", "bb")

first = ["cc", "bb"]
second = ["bb", "aa"]

# check = [["cc", "tr"], ["bb", "aa"]]

print(zip(first, second))
print(line in zip(first, second))
