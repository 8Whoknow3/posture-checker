class PostureError(Exception):
    """Base exception for posture analysis errors."""


class InvalidImageError(PostureError):
    """Raised when the input image cannot be decoded."""


class PoseNotDetectedError(PostureError):
    """Raised when no human pose is detected."""


class WorldLandmarksUnavailableError(PostureError):
    """Raised when 3D world landmarks are unavailable."""


class ImageEncodingError(PostureError):
    """Raised when an output image cannot be encoded."""