import hashlib
from werkzeug.utils import secure_filename


# print("MD5", hashlib.md5("JP1".encode()).hexdigest())
def my_test_func(
        a: int, b: int, c: int, d: int, e: int, f: int, g: int, h: int, i: int, j: int, k: int, l: int, m: int, n: int,
        o: int, p: int, q: int, r: int, s: int, t: int, u: int, v: int, w: int, x: int, y: int, z: int):
    print("my_test_func")


str_res = "/uploads/aa/bb/cc/../webp"  # /
#
print(str_res[:2])
print(str_res[2:4])
print(str_res[4:])

print(secure_filename(str_res))
