import hashlib
from werkzeug.utils import secure_filename

# print("MD5", hashlib.md5("JP1".encode()).hexdigest())

str_res = "/uploads/aa/bb/cc/../webp"

print(str_res[:2])
print(str_res[2:4])
print(str_res[4:])

print(secure_filename(str_res))