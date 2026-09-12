from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


IMAGE_PATH = (
    Path(__file__).resolve().parent
    / "assets"
    / "seated_person.jpg"
)


def test_analyze_endpoint_success():
    assert IMAGE_PATH.exists()

    with TestClient(app) as client:
        with IMAGE_PATH.open("rb") as image:
            response = client.post(
                "/api/analyze",
                files={
                    "image": (
                        "seated_person.jpg",
                        image,
                        "image/jpeg",
                    )
                },
            )

    assert response.status_code == 200

    data = response.json()

    assert "annotated_image" in data
    assert "view_label" in data
    assert "metrics" in data
    assert "overall" in data

    assert data["annotated_image"].startswith(
        "data:image/jpeg;base64,"
    )

    assert len(data["metrics"]) == 5

    metric_keys = {
        metric["key"]
        for metric in data["metrics"]
    }

    assert metric_keys == {
        "cva",
        "trunk",
        "spine_align",
        "head_tilt",
        "trunk_lateral",
    }

    assert "score" in data["overall"]
    assert "max_score" in data["overall"]
    assert "level" in data["overall"]
    assert "level_label" in data["overall"]


def test_analyze_endpoint_invalid_image():
    with TestClient(app) as client:
        response = client.post(
            "/api/analyze",
            files={
                "image": (
                    "invalid.txt",
                    b"not-an-image",
                    "text/plain",
                )
            },
        )

    assert response.status_code == 400

    data = response.json()

    assert data["error"] == "Invalid image file."


def test_analyze_endpoint_without_person():
    image_path = (
        Path(__file__).resolve().parent
        / "assets"
        / "no_person.jpg"
    )

    assert image_path.exists()

    with TestClient(app) as client:
        with image_path.open("rb") as image:
            response = client.post(
                "/api/analyze",
                files={
                    "image": (
                        "no_person.jpg",
                        image,
                        "image/jpeg",
                    )
                },
            )

    assert response.status_code == 422

    data = response.json()

    assert data["error"] == "No person detected."