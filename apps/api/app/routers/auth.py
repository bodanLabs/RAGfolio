"""Authentication routes for signup and login."""

from fastapi import APIRouter, Body, Depends, HTTPException, status

from app.api.dependencies import get_auth_service, get_current_user, get_current_user_model
from app.db.tables import UserRecord
from app.models.auth import LoginRequest, SignupRequest, TokenResponse
from app.models.user import User
from app.services.auth import AuthService
from app.utils.auth import create_access_token

router = APIRouter(tags=["auth"], prefix="/auth")


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignupRequest = Body(...),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Create a new user account and return an access token.

    Args:
        request: Signup request with email and password
        auth_service: Injected AuthService instance

    Returns:
        TokenResponse with JWT access token

    Raises:
        HTTPException: 409 if email already exists
    """
    try:
        user = auth_service.signup(
            email=request.email, password=request.password, name=request.name
        )
    except ValueError as e:
        if "already exists" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        ok=True,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest = Body(...),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Authenticate user and return an access token.

    Args:
        request: Login request with email and password
        auth_service: Injected AuthService instance

    Returns:
        TokenResponse with JWT access token

    Raises:
        HTTPException: 401 if credentials are invalid
    """
    user = auth_service.login(email=request.email, password=request.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        ok=True,
    )


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: User = Depends(get_current_user_model),
):
    """Get current authenticated user information.

    Args:
        current_user: Current authenticated user from JWT token

    Returns:
        User information (id, email, name, created_at)

    Raises:
        HTTPException: 401 if token is missing or invalid
    """
    return current_user
