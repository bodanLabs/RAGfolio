from pathlib import Path
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from starlette.background import BackgroundTasks

from app.settings import settings


class EmailService:
    """Service for sending emails."""

    def __init__(self):
        """Initialize the EmailService with configuration."""
        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.mail_username,
            MAIL_PASSWORD=settings.mail_password,
            MAIL_FROM=settings.mail_from,
            MAIL_PORT=settings.mail_port,
            MAIL_SERVER=settings.mail_server,
            MAIL_STARTTLS=settings.mail_starttls,
            MAIL_SSL_TLS=settings.mail_ssl_tls,
            USE_CREDENTIALS=settings.mail_use_credentials,
            VALIDATE_CERTS=settings.mail_validate_certs,
        )
        self.fm = FastMail(self.conf)

    async def send_invitation_email(
        self,
        email_to: str,
        invite_link: str,
        organization_name: str,
        role: str,
        background_tasks: BackgroundTasks
    ) -> None:
        """Send an invitation email.
        
        Args:
            email_to: Recipient email
            invite_link: Invitation acceptance link
            organization_name: Name of the organization
            role: Role assigned
            background_tasks: FastAPI BackgroundTasks instance
        """
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited!</h2>
            <p>You have been invited to join <strong>{organization_name}</strong> as a <strong>{role}</strong> on RAGfolio.</p>
            <p>Click the button below to accept the invitation:</p>
            <a href="{invite_link}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Accept Invitation</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="{invite_link}">{invite_link}</a></p>
            <p>This invitation will expire in {settings.invitation_expiry_hours} hours.</p>
        </div>
        """

        message = MessageSchema(
            subject=f"Invitation to join {organization_name} on RAGfolio",
            recipients=[email_to],
            body=html,
            subtype=MessageType.html
        )

        background_tasks.add_task(self.fm.send_message, message)
