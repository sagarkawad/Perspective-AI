from tortoise.models import Model
from tortoise import fields


class User(Model):
    __tablename__ = "users"

    id = fields.IntField(pk=True)
    clerk_user_id = fields.CharField(max_length=255, unique=True, index=True)
    credit = fields.IntField(default=100)
    created_at = fields.DatetimeField(auto_now_add=True)

    sessions: fields.ReverseRelation["ChatSession"]
    history_entries: fields.ReverseRelation["HistoryEntry"]


class ChatSession(Model):
    __tablename__ = "chat_sessions"

    id = fields.IntField(primary_key=True, index=True)
    user = fields.ForeignKeyField(
        "models.User", related_name="sessions", null=True, to_field="clerk_user_id")
    machine_id = fields.CharField(index=True, max_length=255, null=True)
    url = fields.CharField(max_length=255)
    summary = fields.TextField()
    perspective = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)
    last_accessed = fields.DatetimeField(auto_now_add=True)

    class Meta:
        unique_together = (("machine_id", "url"), ("user", "url"))


class ChatMessage(Model):
    __tablename__ = "chat_messages"

    id = fields.IntField(primary_key=True, index=True)
    session = fields.ForeignKeyField(
        "models.ChatSession", related_name="events")
    thread_id = fields.CharField(index=True, max_length=255, null=True)
    is_ai = fields.IntField(default=0)  # 0 for user, 1 for AI
    message = fields.CharField(max_length=1024)
    timestamp = fields.DatetimeField(auto_now_add=True)


class HistoryEntry(Model):
    __tablename__ = "history_entries"

    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField(
        "models.User", related_name="history_entries", null=True, to_field="clerk_user_id")
    machine_id = fields.CharField(max_length=255, null=True, index=True)
    type = fields.CharField(max_length=20)
    url = fields.CharField(max_length=255, null=True)
    name = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
