import pytest
from app.ai.evaluator import calculate_deterministic_evaluation
from app.ml.mastery_model import bkt_model
from app.ml.difficulty_model import adapt_next_difficulty


def test_deterministic_evaluation_5_part_rubric():
    question = "Explain polymorphism in Object-Oriented Programming."
    reference = "Polymorphism allows subclasses to provide specific implementations of methods defined in base classes or interfaces, resolved at runtime via method overriding or compile-time via overloading."
    user_answer = "Polymorphism means one interface having multiple forms, implemented via method overriding in derived classes with runtime dynamic dispatch."
    rubric_concepts = ["Interface multiple forms", "Method overriding", "Dynamic dispatch"]

    res = calculate_deterministic_evaluation(question, reference, user_answer, rubric_concepts)
    
    assert "score" in res
    assert res["score"] >= 70
    assert res["rating"] in ["Good", "Excellent"]
    assert "criterion_breakdown" in res
    cb = res["criterion_breakdown"]
    assert "conceptual_correctness" in cb
    assert "key_concept_coverage" in cb
    assert "explanation_quality" in cb
    assert "practical_application" in cb
    assert "clarity_and_structure" in cb


def test_bkt_mastery_update():
    prior = 0.35
    # When user answers correctly, mastery probability should increase
    after_correct = bkt_model.update(prior, is_correct=True)
    assert after_correct > prior

    # When user makes a mistake, mastery drops
    after_wrong = bkt_model.update(after_correct, is_correct=False)
    assert after_wrong < after_correct


def test_adaptive_difficulty():
    assert adapt_next_difficulty("medium", 90.0) == "hard"
    assert adapt_next_difficulty("hard", 95.0) == "expert"
    assert adapt_next_difficulty("expert", 95.0) == "expert"
    assert adapt_next_difficulty("hard", 40.0) == "medium"
    assert adapt_next_difficulty("medium", 40.0) == "easy"
