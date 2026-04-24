import json
import unittest
from unittest.mock import patch

from server.handlers.student.assessment_handlers import parse_new_tasks
from server.models.assessment import AssessmentTaskName


class TestAssessmentNewTryShuffle(unittest.TestCase):
    @staticmethod
    def _reverse_shuffle(items: list[int]) -> None:
        items.reverse()

    @patch("server.handlers.student.assessment_handlers.random.shuffle")
    def test_single_test_options_are_shuffled_and_meta_answer_is_remapped(self, mocked_shuffle):
        mocked_shuffle.side_effect = self._reverse_shuffle

        tasks = [{
            "name": AssessmentTaskName.TEST_SINGLE.value,
            "question": "Pick true",
            "options": ["o0", "o1", "o2", "o3"],
            "meta_answer": 1,
        }]

        parsed_tasks = parse_new_tasks(json.dumps(tasks))
        self.assertEqual(len(parsed_tasks), 1)

        parsed = parsed_tasks[0]
        self.assertEqual(parsed["options"], ["o3", "o2", "o1", "o0"])
        self.assertEqual(parsed["meta_answer"], 2)

    @patch("server.handlers.student.assessment_handlers.random.shuffle")
    def test_multi_test_options_are_shuffled_and_meta_answers_are_remapped(self, mocked_shuffle):
        mocked_shuffle.side_effect = self._reverse_shuffle

        tasks = [{
            "name": AssessmentTaskName.TEST_MULTI.value,
            "question": "Pick true",
            "options": ["o0", "o1", "o2", "o3"],
            "meta_answers": [0, 2, 3],
        }]

        parsed_tasks = parse_new_tasks(json.dumps(tasks))
        self.assertEqual(len(parsed_tasks), 1)

        parsed = parsed_tasks[0]
        self.assertEqual(parsed["options"], ["o3", "o2", "o1", "o0"])
        self.assertEqual(parsed["meta_answers"], [3, 1, 0])


if __name__ == "__main__":
    unittest.main()
