import unittest

from pydantic import ValidationError

from server.models.assessment import (AssessmentTaskName, MultiTestTaskReq, MultiTestTaskRes, MultiTestTaskCreate)


class TestAssessmentMultiTest(unittest.TestCase):
    def test_MultiTestExceptions(self):
        self.assertRaises(ValidationError, MultiTestTaskReq, **{"name": AssessmentTaskName.TEXT})
        self.assertRaises(ValidationError, MultiTestTaskCreate, **{"name": AssessmentTaskName.TEST_MULTI})

    def test_MultiTestRes(self):
        value_base = {
            "name": AssessmentTaskName.TEST_MULTI,
            "question": "Ansewer to this question multi",
            "options": ["False 0", "False 1", "True 2", "True 3"]
        }

        self.assertFalse(MultiTestTaskRes(**value_base, answers=[3, -1]).custom_validation())
        self.assertFalse(MultiTestTaskRes(**value_base, answers=[4, 1]).custom_validation())
        self.assertTrue(MultiTestTaskRes(**value_base, answers=[]).custom_validation())
        self.assertTrue(MultiTestTaskRes(**value_base, answers=[0, 1, 2, 3]).custom_validation())
        self.assertTrue(MultiTestTaskRes(**value_base, answers=[2]).custom_validation())


if __name__ == '__main__':
    unittest.main()
