from io import BytesIO

import cv2
import numpy as np
from PIL import Image

from app.core.exceptions import (
    ImageEncodingError,
    InvalidImageError,
)


def decode_image(contents: bytes) -> np.ndarray:
    """Decode image bytes into a BGR OpenCV image."""

    try:
        image = Image.open(
            BytesIO(contents)
        ).convert("RGB")

    except Exception as exc:
        raise InvalidImageError(
            "Invalid image file."
        ) from exc

    image_rgb = np.asarray(image)

    return cv2.cvtColor(
        image_rgb,
        cv2.COLOR_RGB2BGR,
    )


def encode_jpeg(
    image: np.ndarray,
    quality: int = 90,
) -> bytes:
    """Encode a BGR OpenCV image as JPEG bytes."""

    success, buffer = cv2.imencode(
        ".jpg",
        image,
        [
            cv2.IMWRITE_JPEG_QUALITY,
            quality,
        ],
    )

    if not success:
        raise ImageEncodingError(
            "Failed to encode output image."
        )

    return buffer.tobytes()