from app.db.models import User
from tortoise.transactions import in_transaction
from fastapi import HTTPException


class UserCreditManager:
	def __init__(self, user_id):
		self.user_id = user_id

	async def reduce_credit(self, credit_type: str):
		"""
		Reduce user credits based on the type of action
		credit_type: 'search' for article search (25 credits) or 'message' for chat messages (5 credits)
		"""
		async with in_transaction() as connection:
			try:
				user, _ = await User.get_or_create(
					clerk_user_id=self.user_id, using_db=connection
				)

				credit_reduction = 25 if credit_type == 'search' else 5

				if user.credit < credit_reduction:
					raise HTTPException(
						status_code=402,
						detail=f"Insufficient credits. Required: {
							credit_reduction}, Available: {user.credit}"
					)

				user.credit -= credit_reduction
				await user.save(using_db=connection)
				return user.credit

			except Exception as e:
				await connection.rollback()
				raise e

	async def get_credits(self):
		"""Get current user credits"""
		user, _ = await User.get_or_create(clerk_user_id=self.user_id)
		return user.credit
