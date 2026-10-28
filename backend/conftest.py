import pytest
import asyncio
from database import engine

@pytest.fixture(autouse=True)
def cleanup_engine_fixture():
    try:
        loop = asyncio.new_event_loop()
        loop.run_until_complete(engine.dispose())
        loop.close()
    except Exception:
        pass
    yield
    try:
        loop = asyncio.new_event_loop()
        loop.run_until_complete(engine.dispose())
        loop.close()
    except Exception:
        pass
