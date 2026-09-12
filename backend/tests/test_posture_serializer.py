import numpy as np

from app.api.serializers.posture import (
    serialize_analysis,
    serialize_posture_result,
)


class FakeMetric:
    key = "cva"
    title = "زاویه کرانیوورتبرال"
    tier = 1
    value = 75.84
    unit = "درجه"
    status = "good"
    status_label = "مطلوب"
    reference = "Test Reference"
    tip = "Test Tip"
    convention_note = "عدد بزرگ‌تر = وضعیت بهتر"


def build_analysis():
    """Build a minimal analysis object for serializer tests."""

    return {
        "view_label": "از پهلو (نیم‌رخ)",
        "metrics": [
            FakeMetric(),
        ],
        "overall": {
            "score": 1,
            "max_score": 5,
            "level": "low",
            "level_label": "ریسک پایین",
            "poor_count": 0,
            "caution_count": 0,
        },
    }


def test_serialize_analysis():
    """Test conversion of internal analysis to API data."""

    analysis = build_analysis()

    result = serialize_analysis(
        analysis
    )

    assert result["view_label"] == (
        "از پهلو (نیم‌رخ)"
    )

    assert result["overall"]["score"] == 1

    assert len(
        result["metrics"]
    ) == 1

    metric = result["metrics"][0]

    assert metric["key"] == "cva"
    assert metric["value"] == 75.8
    assert metric["status"] == "good"


def test_serialize_posture_result():
    """Test complete posture result serialization."""

    analysis = build_analysis()

    image = np.zeros(
        (20, 20, 3),
        dtype=np.uint8,
    )

    result = serialize_posture_result(
        analysis=analysis,
        annotated_image=image,
        quality=80,
    )

    assert result["view_label"] == (
        "از پهلو (نیم‌رخ)"
    )

    assert len(
        result["metrics"]
    ) == 1

    assert result["overall"]["level"] == "low"

    assert result["annotated_image"].startswith(
        "data:image/jpeg;base64,"
    )


def test_serialize_posture_result_contains_required_fields():
    """Test the required API response fields."""

    analysis = build_analysis()

    image = np.zeros(
        (20, 20, 3),
        dtype=np.uint8,
    )

    result = serialize_posture_result(
        analysis,
        image,
    )

    assert set(result.keys()) == {
        "annotated_image",
        "view_label",
        "metrics",
        "overall",
    }