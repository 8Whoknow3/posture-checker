from app.api.serializers.posture import (
    serialize_analysis,
)


class TestMetric:
    """Simple metric object for serializer tests."""

    def __init__(
        self,
        key,
        title,
        tier,
        value,
        unit,
        status,
        status_label,
        reference,
        tip,
        convention_note=None,
    ):
        self.key = key
        self.title = title
        self.tier = tier
        self.value = value
        self.unit = unit
        self.status = status
        self.status_label = status_label
        self.reference = reference
        self.tip = tip
        self.convention_note = convention_note


def test_serialize_analysis():
    metric = TestMetric(
        key="cva",
        title="CVA",
        tier=1,
        value=55.678,
        unit="درجه",
        status="good",
        status_label="مطلوب",
        reference="test",
        tip="test",
        convention_note="higher is better",
    )

    analysis = {
        "view_label": "از پهلو (نیم‌رخ)",
        "metrics": [metric],
        "overall": {
            "score": 3,
            "max_score": 11,
            "level": "low",
            "level_label": "ریسک پایین",
            "poor_count": 0,
            "caution_count": 0,
        },
    }

    result = serialize_analysis(
        analysis
    )

    assert result["view_label"] == (
        "از پهلو (نیم‌رخ)"
    )

    assert len(result["metrics"]) == 1

    serialized_metric = (
        result["metrics"][0]
    )

    assert serialized_metric["key"] == "cva"
    assert serialized_metric["value"] == 55.7
    assert serialized_metric["status"] == "good"


def test_serialize_unavailable_metric():
    metric = TestMetric(
        key="head_tilt",
        title="کجی جانبی سر",
        tier=2,
        value=None,
        unit="درجه",
        status="unavailable",
        status_label="قابل سنجش نیست",
        reference=(
            "قابل ارزیابی در نمای روبه‌رو یا زاویه‌دار"
        ),
        tip="سر را در راستای عمود بدن نگه دارید.",
    )

    analysis = {
        "view_label": "از پهلو (نیم‌رخ)",
        "metrics": [metric],
        "overall": {
            "score": 3,
            "max_score": 11,
            "level": "low",
            "level_label": "ریسک پایین",
            "poor_count": 0,
            "caution_count": 0,
        },
    }

    result = serialize_analysis(
        analysis
    )

    serialized_metric = (
        result["metrics"][0]
    )

    assert serialized_metric["value"] is None
    assert serialized_metric["status"] == (
        "unavailable"
    )
    assert serialized_metric[
        "status_label"
    ] == "قابل سنجش نیست"


def test_serialize_analysis_preserves_none_convention_note():
    metric = TestMetric(
        key="trunk_lateral",
        title="کجی جانبی تنه",
        tier=2,
        value=None,
        unit="درجه",
        status="unavailable",
        status_label="قابل سنجش نیست",
        reference="test",
        tip="test",
        convention_note=None,
    )

    analysis = {
        "view_label": "از پهلو (نیم‌رخ)",
        "metrics": [metric],
        "overall": {
            "score": 3,
            "max_score": 11,
            "level": "low",
            "level_label": "ریسک پایین",
            "poor_count": 0,
            "caution_count": 0,
        },
    }

    result = serialize_analysis(
        analysis
    )

    serialized_metric = (
        result["metrics"][0]
    )

    assert serialized_metric[
        "convention_note"
    ] is None