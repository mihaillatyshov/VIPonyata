import unittest

from pydantic import ValidationError

import server.routes.funcs.student_assessment_funcs as SAF
from server.models.assessment import (AssessmentTaskName, TextTaskReq, TextTaskRes, TextTaskReqCreate,
                                      SingleTestTaskReq, SingleTestTaskRes, SingleTestTaskReqCreate, MultiTestTaskReq,
                                      MultiTestTaskRes, MultiTestTaskReqCreate)


class TestAssessmentModels(unittest.TestCase):
    def test_Text(self):
        self.assertRaises(ValidationError, TextTaskReq, **{"name": AssessmentTaskName.TEST_SINGLE})
        self.assertRaises(ValidationError, TextTaskReqCreate, **{"name": AssessmentTaskName.TEXT})

        self.assertTrue(TextTaskRes(name=AssessmentTaskName.TEXT, text="some text").custom_validation())

    def test_SingleTest(self):
        value_base = {
            "name": AssessmentTaskName.TEST_SINGLE,
            "question": "Ansewer to this question multi",
            "options": ["False 0", "False 1", "True 2", "True 3"]
        }

        self.assertRaises(ValidationError, SingleTestTaskReq, **{"name": AssessmentTaskName.TEXT})
        self.assertRaises(ValidationError, SingleTestTaskReqCreate, **{"name": AssessmentTaskName.TEST_SINGLE})

        self.assertTrue(SingleTestTaskRes(**value_base, answer=None).custom_validation())

        self.assertFalse(SingleTestTaskRes(**value_base, answer=-1).custom_validation())

        self.assertFalse(SingleTestTaskRes(**value_base, answer=4).custom_validation())

        self.assertTrue(SingleTestTaskRes(**value_base, answer=0).custom_validation())

        self.assertTrue(SingleTestTaskRes(**value_base, answer=3).custom_validation())

    def test_MultiTest(self):
        self.assertRaises(ValidationError, SingleTestTaskReq, **{"name": AssessmentTaskName.TEXT})
        self.assertRaises(ValidationError, SingleTestTaskReqCreate, **{"name": AssessmentTaskName.TEST_MULTI})


if __name__ == '__main__':
    unittest.main()