class AbstractTest:
    name: str

    @property
    def test_name(self):
        return self.name


class OverTest(AbstractTest):
    name = "new Name"


obj = OverTest()
print(obj.test_name)
print(OverTest.__name__)
