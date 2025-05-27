from tortoise import Tortoise


async def init_db():
    """Initialize the database by creating all tables."""
    await Tortoise.init(
        db_url='sqlite://db.sqlite3',
        modules={'models': ['app.db.models']}
    )
    await Tortoise.generate_schemas()
