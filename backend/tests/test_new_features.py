import unittest
import uuid
from datetime import datetime
from pydantic import ValidationError

from app.llm.prompt_builder import PromptBuilder
from app.api.endpoints.admin import serialize_model_row, TABLE_MODEL_MAP
from app.models.domain import User, Conversation, Message, Memory
from app.core.config import settings

class TestNewFeatures(unittest.TestCase):
    def test_first_turn_radhe_radhe_prompt_directive(self):
        # 1. When is_first_response is True, prompt should include sacred Radhe Radhe instruction
        prompt_first = PromptBuilder.build_prompt(
            user_message="Pranam, how do I overcome grief?",
            is_first_response=True
        )
        self.assertIn("!! Radhe Radhe !!", prompt_first)
        self.assertIn("SACRED GREETING", prompt_first)

        # 2. When is_first_response is False, prompt should not include it
        prompt_later = PromptBuilder.build_prompt(
            user_message="Tell me more about duty.",
            is_first_response=False
        )
        self.assertNotIn("SACRED GREETING", prompt_later)

    def test_admin_table_model_map(self):
        # Check all required tables are mapped
        expected_tables = [
            "users", "conversations", "messages", "memories", 
            "user_preferences", "message_feedbacks", "voice_sessions", 
            "verses", "chapters", "admin_audit_logs"
        ]
        for tbl in expected_tables:
            self.assertIn(tbl, TABLE_MODEL_MAP)
            self.assertIsNotNone(TABLE_MODEL_MAP[tbl]["model"])
            self.assertIn("description", TABLE_MODEL_MAP[tbl])

    def test_model_row_serializer(self):
        # Create a mock user
        u = User(
            id=uuid.uuid4(),
            email="seeker@gitamitra.org",
            name="Arjuna",
            password_hash="secret_hashed_value",
            role="user",
            created_at=datetime.utcnow()
        )
        serialized = serialize_model_row(u)
        self.assertEqual(serialized["email"], "seeker@gitamitra.org")
        self.assertEqual(serialized["name"], "Arjuna")
        self.assertEqual(serialized["password_hash"], "[PROTECTED_HASH]")
        self.assertIsInstance(serialized["id"], str)
        self.assertIsInstance(serialized["created_at"], str)

    def test_admin_emails_configuration(self):
        admin_emails = [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()]
        self.assertIn("admin@gitamitra.org", admin_emails)
        self.assertIn("anubhavkr0407@gmail.com", admin_emails)

if __name__ == "__main__":
    unittest.main()
