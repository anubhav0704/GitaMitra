"""Add message_feedbacks table for user feedback

Revision ID: 7a8f910b11c2
Revises: 4f8a12bc90de
Create Date: 2026-09-13 17:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '7a8f910b11c2'
down_revision: Union[str, Sequence[str], None] = '4f8a12bc90de'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'message_feedbacks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('message_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('messages.id', ondelete='CASCADE'), nullable=True),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('is_helpful', sa.Boolean(), nullable=False),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('ix_message_feedbacks_user_id', 'message_feedbacks', ['user_id'])
    op.create_index('ix_message_feedbacks_message_id', 'message_feedbacks', ['message_id'])

def downgrade() -> None:
    op.drop_index('ix_message_feedbacks_message_id', table_name='message_feedbacks')
    op.drop_index('ix_message_feedbacks_user_id', table_name='message_feedbacks')
    op.drop_table('message_feedbacks')
