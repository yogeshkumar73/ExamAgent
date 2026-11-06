from typing import List, Optional, Dict, Any


def build_evaluation_prompt(
    question: str,
    reference_answer: str,
    user_answer: str,
    rubric_concepts: Optional[List[str]] = None,
    source_context: Optional[str] = None,
    difficulty: str = "medium"
) -> tuple[str, str]:
    """
    Constructs the system instruction and user prompt according to Section 16 & Section 5 of the Blueprint.
    """
    system_instruction = """SYSTEM ROLE: AI educational assessment and technical interview evaluation agent.
OBJECTIVE: Evaluate the user response using supplied source content, question, reference answer, and rubric.
RULES:
1. Assess meaning and conceptual correctness, not exact wording.
2. List correct, incorrect, and missing concepts.
3. Do not invent unsupported facts.
4. Disclose ambiguity or insufficient source evidence.
5. Give a corrected answer and actionable suggestions.
6. Apply the 5-part rubric consistently; do not reward filler:
   - Conceptual correctness (weight 40%)
   - Key concept coverage (weight 25%)
   - Explanation quality (weight 15%)
   - Practical application (weight 10%)
   - Clarity and structure (weight 10%)
7. Rating scale:
   - 90-100: "Excellent" (Accurate, complete, well explained)
   - 75-89: "Good" (Mostly correct; minor gaps)
   - 50-74: "Needs Improvement" (Partially correct; concepts missing)
   - 0-49: "Weak" (Incorrect or substantially incomplete)
8. Output MUST strictly be valid JSON format."""

    rubric_str = ", ".join(rubric_concepts) if rubric_concepts else "Conceptual accuracy, core trade-offs, practical syntax/architecture"
    context_str = source_context if source_context else "Standard Computer Science & Software Engineering Principles."

    user_prompt = f"""SOURCE CONTEXT:
{context_str}

INTERVIEW QUESTION ({difficulty}):
{question}

REFERENCE ANSWER:
{reference_answer}

KEY RUBRIC CONCEPTS:
{rubric_str}

USER SUBMITTED ANSWER:
{user_answer}

Evaluate the user answer and return a JSON object with this exact structure:
{{
  "score": <number 0-100>,
  "rating": "<Excellent|Good|Needs Improvement|Weak>",
  "criterion_breakdown": {{
    "conceptual_correctness": <0-40>,
    "key_concept_coverage": <0-25>,
    "explanation_quality": <0-15>,
    "practical_application": <0-10>,
    "clarity_and_structure": <0-10>
  }},
  "correct_concepts": [<list of strings>],
  "missing_concepts": [<list of strings>],
  "corrected_answer": "<improved, complete technical answer>",
  "improvement_suggestions": [<actionable feedback items>],
  "follow_up_question": "<targeted follow-up probing question>",
  "confidence": <0.80-0.99>
}}"""

    return system_instruction, user_prompt


def build_question_generator_prompt(
    topic: str,
    difficulty: str,
    question_type: str,
    source_context: Optional[str] = None
) -> tuple[str, str]:
    system_instruction = """You are an Expert AI Technical Interviewer & Curriculum Designer.
Generate a high quality grounded interview question based on the provided topic and source material.
Provide a clear reference answer, rubric concepts, and a helpful hint. Return strictly valid JSON."""

    context_str = source_context if source_context else "Full Stack Software Engineering, System Design, Data Structures & Algorithms, Clean Architecture."

    user_prompt = f"""SOURCE MATERIAL:
{context_str}

TOPIC: {topic}
DIFFICULTY: {difficulty}
QUESTION TYPE: {question_type}

Generate 1 realistic interview question and return JSON formatted as:
{{
  "question": "<the interview question>",
  "topic": "{topic}",
  "difficulty": "{difficulty}",
  "type": "{question_type}",
  "options": [<list of 4 string options if MCQ, otherwise empty array>],
  "reference_answer": "<complete model answer>",
  "rubric": {{
    "key_concepts": [<list of 3-5 essential points>],
    "weights": {{"conceptual_correctness": 40, "concept_coverage": 25, "explanation_quality": 15, "practical_application": 10, "clarity": 10}}
  }},
  "hint": "<guidance hint without giving away the full answer>"
}}"""

    return system_instruction, user_prompt
