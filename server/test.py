import threading


def SomeFunction(arg1, arg2):
    print("[START] Some Function Work", arg1)
    print("[ END ] Some Function Work", arg2)


def printit():
    threading.Timer(5.0, SomeFunction, args={10, 15}).start()
    print("Hello, World!")


printit()

for i in range(10):
    print("Some work")

# continue with the rest of your code
