from fastapi import HTTPException, status


class SkillArenaException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class ResourceNotFoundException(SkillArenaException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} '{identifier}' not found."
        )


class UnauthorizedException(SkillArenaException):
    def __init__(self, detail: str = "Invalid or expired authentication credentials."):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenException(SkillArenaException):
    def __init__(self, detail: str = "You do not have permission to access this resource."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class RateLimitExceededException(SkillArenaException):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Please retry in {retry_after} seconds."
        )


class ValidationException(SkillArenaException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)
