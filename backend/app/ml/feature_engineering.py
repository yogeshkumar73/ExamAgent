import numpy as np
import pandas as pd
from typing import List, Dict, Any


def extract_session_features(attempts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extracts statistical features from attempt history using NumPy and Pandas (Section 6).
    """
    if not attempts:
        return {
            "attempt_count": 0,
            "mean_score": 0.0,
            "std_score": 0.0,
            "mean_response_time_ms": 0,
            "accuracy_ratio": 0.0,
            "score_trend_slope": 0.0
        }

    df = pd.DataFrame(attempts)
    scores = df["score"].values if "score" in df else np.array([])
    response_times = df["response_time_ms"].values if "response_time_ms" in df else np.array([])

    mean_score = float(np.mean(scores)) if len(scores) > 0 else 0.0
    std_score = float(np.std(scores)) if len(scores) > 0 else 0.0
    mean_rt = int(np.mean(response_times)) if len(response_times) > 0 else 0
    accuracy_ratio = float(np.sum(scores >= 75) / len(scores)) if len(scores) > 0 else 0.0

    # Linear trend slope
    if len(scores) >= 2:
        x = np.arange(len(scores))
        slope, _ = np.polyfit(x, scores, 1)
        score_trend_slope = float(slope)
    else:
        score_trend_slope = 0.0

    return {
        "attempt_count": len(attempts),
        "mean_score": round(mean_score, 2),
        "std_score": round(std_score, 2),
        "mean_response_time_ms": mean_rt,
        "accuracy_ratio": round(accuracy_ratio, 2),
        "score_trend_slope": round(score_trend_slope, 2)
    }
