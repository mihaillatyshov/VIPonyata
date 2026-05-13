import datetime

from server.common import DBsession
from server.models.db_models import ReviewDictionary, ReviewTopic, ReviewWord, User
from server.models.review import ReviewTrainingSessionResultsReq, ReviewTrainingSessionResultReq, ReviewWordCreateReq, ReviewWordMemoryStateUpdateReq
from server.queries import ReviewDBqueries


def _create_review_owner(create_db) -> int:
    DBsession.init(create_db)

    with DBsession.begin() as session:
        user = User(name="Review Teacher",
                    nickname="review_teacher",
                    password="password123",
                    birthday=datetime.date(1990, 1, 1),
                    level=User.Level.TEACHER)
        session.add(user)
        session.flush()

        dictionary = ReviewDictionary(title="Dictionary", owner_id=user.id, sort=10)
        session.add(dictionary)
        session.flush()

        topic = ReviewTopic(title="Topic", dictionary_id=dictionary.id, sort=10)
        session.add(topic)
        session.flush()

        return topic.id


def test_create_review_word_sets_default_memory_state(create_db):
    topic_id = _create_review_owner(create_db)

    word = ReviewDBqueries.create_review_word(
        1,
        ReviewWordCreateReq(topic_id=topic_id, source="src", word_jp="単語", ru="слово", note=None, examples=None),
    )

    assert word.status == ReviewWord.Status.PASSIVE
    assert word.stage == 1
    assert word.is_frozen is False


def test_apply_review_training_session_results_moves_word_states(create_db):
    topic_id = _create_review_owner(create_db)

    with DBsession.begin() as session:
        session.add_all([
            ReviewWord(topic_id=topic_id,
                       word_jp="単語1",
                       ru="слово 1",
                       status=ReviewWord.Status.SHAKY,
                       stage=3,
                       is_frozen=False),
            ReviewWord(topic_id=topic_id,
                       word_jp="単語2",
                       ru="слово 2",
                       status=ReviewWord.Status.PASSIVE,
                       stage=2,
                       is_frozen=False),
            ReviewWord(topic_id=topic_id,
                       word_jp="単語3",
                       ru="слово 3",
                       status=ReviewWord.Status.ACTIVE,
                       stage=1,
                       is_frozen=False),
        ])
        session.flush()
        word_ids = [word.id for word in session.query(ReviewWord).order_by(ReviewWord.id).all()]

    updated_words = ReviewDBqueries.apply_review_training_session_results(
        1,
        ReviewTrainingSessionResultsReq(results=[
            ReviewTrainingSessionResultReq(word_id=word_ids[0], result="remember"),
            ReviewTrainingSessionResultReq(word_id=word_ids[1], result="partial"),
            ReviewTrainingSessionResultReq(word_id=word_ids[2], result="forgot"),
        ]),
    )

    updated_by_id = {word.id: word for word in updated_words}

    assert (updated_by_id[word_ids[0]].status, updated_by_id[word_ids[0]].stage) == (ReviewWord.Status.PASSIVE, 1)
    assert (updated_by_id[word_ids[1]].status, updated_by_id[word_ids[1]].stage) == (ReviewWord.Status.PASSIVE, 2)
    assert (updated_by_id[word_ids[2]].status, updated_by_id[word_ids[2]].stage) == (ReviewWord.Status.PASSIVE, 3)


def test_update_review_word_memory_state_toggles_freeze_flag(create_db):
    topic_id = _create_review_owner(create_db)

    with DBsession.begin() as session:
        word = ReviewWord(topic_id=topic_id, word_jp="単語", ru="слово")
        session.add(word)
        session.flush()
        word_id = word.id

    updated_word = ReviewDBqueries.update_review_word_memory_state(
        1,
        word_id,
        ReviewWordMemoryStateUpdateReq(is_frozen=True),
    )

    assert updated_word.is_frozen is True


def test_get_review_catalog_normalizes_words_without_review_history_to_passive_stage_one(create_db):
    topic_id = _create_review_owner(create_db)

    with DBsession.begin() as session:
        session.add(ReviewWord(topic_id=topic_id, word_jp="単語", ru="слово", status="unknown", stage=99,
                               is_frozen=False))

    catalog = ReviewDBqueries.get_review_catalog(1)

    assert len(catalog["words"]) == 1
    assert catalog["words"][0]["status"] == ReviewWord.Status.PASSIVE
    assert catalog["words"][0]["stage"] == 1
