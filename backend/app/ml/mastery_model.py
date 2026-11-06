class BayesianKnowledgeTracing:
    """
    Standard Bayesian Knowledge Tracing (BKT) Model (Section 6).
    Parameters:
    - p_init: Initial prior probability of knowing the skill (P(L0))
    - p_transit: Probability of transitioning from unlearned to learned (P(T))
    - p_guess: Probability of correct guess when skill is unknown (P(G))
    - p_slip: Probability of slip / mistake when skill is known (P(S))
    """
    def __init__(
        self,
        p_init: float = 0.35,
        p_transit: float = 0.20,
        p_guess: float = 0.15,
        p_slip: float = 0.10
    ):
        self.p_init = p_init
        self.p_transit = p_transit
        self.p_guess = p_guess
        self.p_slip = p_slip

    def update(self, p_known: float, is_correct: bool) -> float:
        # 1. Posterior calculation
        if is_correct:
            numerator = p_known * (1.0 - self.p_slip)
            denominator = numerator + (1.0 - p_known) * self.p_guess
        else:
            numerator = p_known * self.p_slip
            denominator = numerator + (1.0 - p_known) * (1.0 - self.p_guess)

        p_posterior = numerator / max(1e-6, denominator)

        # 2. Learning transition to next practice event
        p_next = p_posterior + (1.0 - p_posterior) * self.p_transit
        return round(min(0.99, max(0.01, p_next)), 3)


def update_ema_mastery(prior_ema: float, score: float, alpha: float = 0.3) -> float:
    """Updates mastery using Exponential Moving Average (EMA)."""
    normalized_score = score / 100.0
    new_ema = (alpha * normalized_score) + ((1.0 - alpha) * prior_ema)
    return round(min(1.0, max(0.0, new_ema)), 3)


bkt_model = BayesianKnowledgeTracing()
