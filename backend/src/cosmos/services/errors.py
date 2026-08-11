class RuntimeServiceError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def require_permission(permissions: frozenset[str], permission: str) -> None:
    if permission not in permissions:
        raise RuntimeServiceError("permission_denied", f"Permission required: {permission}")
