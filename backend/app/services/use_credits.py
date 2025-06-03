from app.db.models import User
from tortoise.transactions import in_transaction


class UserCreditManager:
    def __init__(self, user_id):
        self.user_id = user_id

    async def reduce_credit(self):
        async with in_transaction() as connection:
            try:
                user_ = await User.get_or_create(
                    clerk_user_id=self.user_id, using_db=connection
                )

            except Exception as e:
                await connection.rollback()
                raise e
