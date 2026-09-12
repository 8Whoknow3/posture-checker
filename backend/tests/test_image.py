from io import BytesIO

import numpy as np
import pytest
from PIL import Image

from app.core.exceptions import (
    InvalidImageError,
)
from app.utils.image import (
    decode_image,
    encode_jpeg,
)


# ============================================================
# DECODE
# ============================================================

def test_decode_image():
    """Test decoding an image into an OpenCV array."""

    image = Image.new(
        "RGB",
        (20, 20),
        (255, 0, 0),
    )

    buffer = BytesIO()

    image.save(
        buffer,
        format="PNG",
    )

    result = decode_image(
        buffer.getvalue()
    )

    assert isinstance(
        result,
        np.ndarray,
    )

    assert result.shape == (
        20,
        20,
        3,
    )


# ============================================================
# ENCODE
# ============================================================

def test_encode_jpeg():
    """Test JPEG encoding."""

    image = np.zeros(
        (20, 20, 3),
        dtype=np.uint8,
    )

    result = encode_jpeg(
        image
    )

    assert isinstance(
        result,
        bytes,
    )

    assert result.startswith(
        b"\xff\xd8"
    )


# ============================================================
# INVALID IMAGE
# ============================================================

def test_decode_invalid_image():
    """Test invalid image handling."""

    with pytest.raises(
        InvalidImageError,
        match="Invalid image file",
    ):
        decode_image(
            b"invalid-image"
        )