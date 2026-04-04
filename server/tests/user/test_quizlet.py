import datetime
import json

from sqlalchemy import select

from server.common import DBsession
from server.models.db_models import QuizletSession, QuizletSessionIncorrectWord, QuizletSessionWord, User
from server.models.quizlet import QuizletFlashcardAnswerReq, QuizletRetryIncorrectReq
from server.queries import StudentDBqueries


def test_flashcard_incorrect_answer_requeues_word_at_random_later_position(create_db, monkeypatch):
    DBsession.init(create_db)

    with DBsession.begin() as session:
        user = User(name="Quizlet Student",
                    nickname="quizlet_student",
                    password="password123",
                    birthday=datetime.date(2000, 1, 1),
                    level=User.Level.STUDENT)
        session.add(user)
        session.flush()

        quiz_session = QuizletSession(quiz_type=QuizletSession.Type.FLASHCARDS,
                                      show_hints=False,
                                      translation_direction="jp_to_ru",
                                      total_words=8,
                                      user_id=user.id,
                                      queue_state="[]")
        session.add(quiz_session)
        session.flush()

        words = [
            QuizletSessionWord(source_type="combined",
                               source_word_id=index + 1,
                               char_jp=f"漢字{index + 1}",
                               word_jp=f"かな{index + 1}",
                               ru=f"перевод {index + 1}",
                               session_id=quiz_session.id) for index in range(8)
        ]
        session.add_all(words)
        session.flush()

        word_ids = [word.id for word in words]
        quiz_session.queue_state = json.dumps(word_ids)

    # Mock randint to return 5, so the word is inserted at position 5
    # Initial queue: [w0, w1, w2, w3, w4, w5, w6, w7]
    # After removing w0: [w1, w2, w3, w4, w5, w6, w7]
    # Insert position 5 (after minimum 4-card distance): [w1, w2, w3, w4, w0, w5, w6, w7]
    monkeypatch.setattr(StudentDBqueries.random, "randint", lambda start, end: 5)

    StudentDBqueries.mark_quizlet_flashcard_answer(
        user.id,
        quiz_session.id,
        QuizletFlashcardAnswerReq(session_word_id=word_ids[0], recognized=False),
    )

    with DBsession.begin() as session:
        updated_session = session.get(QuizletSession, quiz_session.id)
        updated_word = session.get(QuizletSessionWord, word_ids[0])

        assert updated_session is not None
        assert updated_word is not None
        assert json.loads(updated_session.queue_state) == [
            word_ids[1], word_ids[2], word_ids[3], word_ids[4], word_ids[0], word_ids[5], word_ids[6], word_ids[7]
        ]
        assert updated_session.incorrect_answers == 1
        assert updated_word.incorrect_attempts == 1
        assert updated_word.is_correct is False


def test_flashcard_incorrect_answer_small_queue_appends_at_end(create_db):
    """Test that with queue < 4 cards, incorrect word is appended at end."""
    DBsession.init(create_db)

    with DBsession.begin() as session:
        user = User(name="Quizlet Student",
                    nickname="quizlet_student",
                    password="password123",
                    birthday=datetime.date(2000, 1, 1),
                    level=User.Level.STUDENT)
        session.add(user)
        session.flush()

        quiz_session = QuizletSession(quiz_type=QuizletSession.Type.FLASHCARDS,
                                      show_hints=False,
                                      translation_direction="jp_to_ru",
                                      total_words=3,
                                      user_id=user.id,
                                      queue_state="[]")
        session.add(quiz_session)
        session.flush()

        words = [
            QuizletSessionWord(source_type="combined",
                               source_word_id=index + 1,
                               char_jp=f"漢字{index + 1}",
                               word_jp=f"かな{index + 1}",
                               ru=f"перевод {index + 1}",
                               session_id=quiz_session.id) for index in range(3)
        ]
        session.add_all(words)
        session.flush()

        word_ids = [word.id for word in words]
        quiz_session.queue_state = json.dumps(word_ids)

    StudentDBqueries.mark_quizlet_flashcard_answer(
        user.id,
        quiz_session.id,
        QuizletFlashcardAnswerReq(session_word_id=word_ids[0], recognized=False),
    )

    with DBsession.begin() as session:
        updated_session = session.get(QuizletSession, quiz_session.id)
        # With 3 cards, after removing first one, we have 2 cards (< 4)
        # So the word should be appended at the end
        assert json.loads(updated_session.queue_state) == [word_ids[1], word_ids[2], word_ids[0]]


def test_flashcard_incorrect_answer_boundary_4_cards_appends_at_end(create_db):
    """Test that with queue = 4 cards, incorrect word is appended at end."""
    DBsession.init(create_db)

    with DBsession.begin() as session:
        user = User(name="Quizlet Student",
                    nickname="quizlet_student",
                    password="password123",
                    birthday=datetime.date(2000, 1, 1),
                    level=User.Level.STUDENT)
        session.add(user)
        session.flush()

        quiz_session = QuizletSession(quiz_type=QuizletSession.Type.FLASHCARDS,
                                      show_hints=False,
                                      translation_direction="jp_to_ru",
                                      total_words=4,
                                      user_id=user.id,
                                      queue_state="[]")
        session.add(quiz_session)
        session.flush()

        words = [
            QuizletSessionWord(source_type="combined",
                               source_word_id=index + 1,
                               char_jp=f"漢字{index + 1}",
                               word_jp=f"かな{index + 1}",
                               ru=f"перевод {index + 1}",
                               session_id=quiz_session.id) for index in range(4)
        ]
        session.add_all(words)
        session.flush()

        word_ids = [word.id for word in words]
        quiz_session.queue_state = json.dumps(word_ids)

    StudentDBqueries.mark_quizlet_flashcard_answer(
        user.id,
        quiz_session.id,
        QuizletFlashcardAnswerReq(session_word_id=word_ids[0], recognized=False),
    )

    with DBsession.begin() as session:
        updated_session = session.get(QuizletSession, quiz_session.id)
        # With 4 cards, after removing first one, we have 3 cards (< 4)
        # So the word should be appended at the end
        assert json.loads(updated_session.queue_state) == [word_ids[1], word_ids[2], word_ids[3], word_ids[0]]


def test_get_active_quizlet_session_returns_latest_unfinished(create_db):
    DBsession.init(create_db)

    with DBsession.begin() as session:
        user = User(name="Quizlet Student",
                    nickname="quizlet_student",
                    password="password123",
                    birthday=datetime.date(2000, 1, 1),
                    level=User.Level.STUDENT)
        session.add(user)
        session.flush()

        session.add(
            QuizletSession(quiz_type=QuizletSession.Type.FLASHCARDS,
                           show_hints=False,
                           translation_direction="jp_to_ru",
                           total_words=10,
                           user_id=user.id,
                           is_finished=False,
                           updated_at=datetime.datetime(2026, 4, 4, 9, 0, 0),
                           queue_state="[]"))

        finished_newer = QuizletSession(quiz_type=QuizletSession.Type.PAIR,
                                        show_hints=False,
                                        translation_direction="jp_to_ru",
                                        total_words=10,
                                        user_id=user.id,
                                        is_finished=True,
                                        updated_at=datetime.datetime(2026, 4, 4, 10, 0, 0),
                                        queue_state="[]")
        session.add(finished_newer)

        active_latest = QuizletSession(quiz_type=QuizletSession.Type.PAIR,
                                       show_hints=False,
                                       translation_direction="jp_to_ru",
                                       total_words=10,
                                       user_id=user.id,
                                       is_finished=False,
                                       updated_at=datetime.datetime(2026, 4, 4, 11, 0, 0),
                                       queue_state="[]")
        session.add(active_latest)

    result = StudentDBqueries.get_active_quizlet_session(user.id)

    assert result is not None
    assert result.id == active_latest.id
    assert result.is_finished is False


def test_get_active_quizlet_session_returns_none_when_no_unfinished(create_db):
    DBsession.init(create_db)

    with DBsession.begin() as session:
        user = User(name="Quizlet Student",
                    nickname="quizlet_student",
                    password="password123",
                    birthday=datetime.date(2000, 1, 1),
                    level=User.Level.STUDENT)
        session.add(user)
        session.flush()

        session.add(
            QuizletSession(quiz_type=QuizletSession.Type.FLASHCARDS,
                           show_hints=False,
                           translation_direction="jp_to_ru",
                           total_words=10,
                           user_id=user.id,
                           is_finished=True,
                           queue_state="[]"))

    result = StudentDBqueries.get_active_quizlet_session(user.id)

    assert result is None


def test_retry_quizlet_incorrect_words_includes_incorrect_and_unviewed_words(create_db, monkeypatch):
    DBsession.init(create_db)

    with DBsession.begin() as session:
        user = User(name="Quizlet Student",
                    nickname="quizlet_student",
                    password="password123",
                    birthday=datetime.date(2000, 1, 1),
                    level=User.Level.STUDENT)
        session.add(user)
        session.flush()

        source_session = QuizletSession(quiz_type=QuizletSession.Type.FLASHCARDS,
                                        show_hints=True,
                                        translation_direction="jp_to_ru",
                                        total_words=4,
                                        user_id=user.id,
                                        is_finished=True,
                                        queue_state="[]")
        session.add(source_session)
        session.flush()

        words = [
            QuizletSessionWord(source_type="combined",
                               source_word_id=index + 1,
                               char_jp=f"漢字{index + 1}",
                               word_jp=f"かな{index + 1}",
                               ru=f"перевод {index + 1}",
                               session_id=source_session.id) for index in range(4)
        ]
        session.add_all(words)
        session.flush()

        words[0].incorrect_attempts = 1
        words[2].correct_attempts = 1
        words[3].incorrect_attempts = 1
        words[3].correct_attempts = 1

        session.add_all([
            QuizletSessionIncorrectWord(session_id=source_session.id, session_word_id=words[0].id),
            QuizletSessionIncorrectWord(session_id=source_session.id, session_word_id=words[3].id),
        ])

    monkeypatch.setattr(StudentDBqueries.random, "shuffle", lambda items: None)

    retry_session = StudentDBqueries.retry_quizlet_incorrect_words(
        user.id,
        QuizletRetryIncorrectReq(source_session_id=source_session.id),
    )

    with DBsession.begin() as session:
        saved_retry_session = session.get(QuizletSession, retry_session.id)
        retry_words = session.scalars(
            select(QuizletSessionWord).where(QuizletSessionWord.session_id == retry_session.id)).all()

        assert saved_retry_session is not None
        assert saved_retry_session.total_words == 3
        assert saved_retry_session.show_hints is True
        assert [word.source_word_id for word in retry_words] == [1, 2, 4]
        assert len(json.loads(saved_retry_session.queue_state)) == 3


def test_retry_quizlet_incorrect_words_includes_unviewed_words_when_no_errors(create_db, monkeypatch):
    DBsession.init(create_db)

    with DBsession.begin() as session:
        user = User(name="Quizlet Student",
                    nickname="quizlet_student",
                    password="password123",
                    birthday=datetime.date(2000, 1, 1),
                    level=User.Level.STUDENT)
        session.add(user)
        session.flush()

        source_session = QuizletSession(quiz_type=QuizletSession.Type.PAIR,
                                        show_hints=False,
                                        translation_direction="ru_to_jp",
                                        total_words=3,
                                        user_id=user.id,
                                        is_finished=True,
                                        queue_state="[]")
        session.add(source_session)
        session.flush()

        words = [
            QuizletSessionWord(source_type="combined",
                               source_word_id=index + 1,
                               char_jp=f"漢字{index + 1}",
                               word_jp=f"かな{index + 1}",
                               ru=f"перевод {index + 1}",
                               session_id=source_session.id) for index in range(3)
        ]
        session.add_all(words)
        session.flush()

        words[0].correct_attempts = 1

    monkeypatch.setattr(StudentDBqueries.random, "shuffle", lambda items: None)

    retry_session = StudentDBqueries.retry_quizlet_incorrect_words(
        user.id,
        QuizletRetryIncorrectReq(source_session_id=source_session.id),
    )

    with DBsession.begin() as session:
        saved_retry_session = session.get(QuizletSession, retry_session.id)
        retry_words = session.scalars(
            select(QuizletSessionWord).where(QuizletSessionWord.session_id == retry_session.id)).all()

        assert saved_retry_session is not None
        assert saved_retry_session.total_words == 2
        assert saved_retry_session.quiz_type == QuizletSession.Type.PAIR
        assert saved_retry_session.translation_direction == "ru_to_jp"
        assert [word.source_word_id for word in retry_words] == [2, 3]
