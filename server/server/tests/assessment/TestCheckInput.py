import unittest

import server.routes.funcs.student_assessment_funcs as SAF


class TestSum(unittest.TestCase):
    def createOriginTest(self, parser: SAF.AssessmentParser, origin: dict, tests: list[dict]):
        with self.subTest(origin=origin):
            self.assertTrue(parser.checkInput(origin, origin))

        for test in tests:
            with self.subTest(test=test):
                if test.get("result"):
                    self.assertTrue(parser.checkInput(origin, test["value"]))
                else:
                    self.assertFalse(parser.checkInput(origin, test["value"]))

    def test_Text(self):
        testOrigin = {"name": "text", "text": "Some Text 1"}
        tests = [{"value": {"name": "text"}, "result": True}]

        self.createOriginTest(SAF.TextParser(), testOrigin, tests)

    def test_SingleTest(self):
        testOrigin = {                                                                                                  # Test Original
            "name": "test_single",
            "question": "Ansewer to this question single",
            "options": ["False 0", "False 1", "True 2", "False 3"],
            "answer": 2
        }

        def valueCreator(value):
            return {"name": "test_single", "answer": value}

        tests = [
            {
                "value": {                                                                                              # No Answer
                    "name": "test_single"
                }
            },
            {
                "value": valueCreator(None)                                                                             # Answer is None
            },
            {
                "value": valueCreator(-2)                                                                               # Answer < 0
            },
            {
                "value": valueCreator(5)                                                                                # Answer >= len(options)
            },
            {
                "value": valueCreator("answer")                                                                         # Other type
            },
            {
                "value": valueCreator([])                                                                               # Other type
            },
            {
                "value": valueCreator("0")                                                                              # Other type
            },
            {
                "value": valueCreator(0),
                "result": True
            },
            {
                "value": valueCreator(1),
                "result": True
            },
            {
                "value": valueCreator(2),
                "result": True
            },
            {
                "value": valueCreator(3),
                "result": True
            }
        ]

        self.createOriginTest(SAF.SingleTestParser(), testOrigin, tests)

    def test_MultiTest(self):
        testOrigin = {                                                                                                  # Test Original
            "name": "test_multi",
            "question": "Ansewer to this question multi",
            "options": ["False 0", "False 1", "True 2", "True 3"],
            "answer": [2, 3]
        }

        def valueCreator(value):
            return {"name": "test_multi", "answer": value}

        tests = [
            {
                "value": {                                                                                              # No Answer
                    "name": "test_multi"
                }
            },
            {
                "value": valueCreator([3, -2, 1])                                                                       # Answer < 0
            },
            {
                "value": valueCreator([1, 5, 3])                                                                        # Answer >= len(options)
            },
            {
                "value": valueCreator("answer")                                                                         # Other type
            },
            {
                "value": valueCreator(1)                                                                                # Other type
            },
            {
                "value": valueCreator([1, "0"])                                                                         # Other type
            },
            {
                "value": valueCreator([1, 3, 3])                                                                        # Repeats
            },
            {
                "value": valueCreator([1]),
                "result": True
            }
        ]

        self.createOriginTest(SAF.MultiTestParser(), testOrigin, tests)


if __name__ == '__main__':
    unittest.main()