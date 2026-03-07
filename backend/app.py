"""
SSTG – Root entry point
=======================
This file lets you run the server from the backend/ root directory:

    python app.py                  # development (auto-reload)
    uvicorn app:application        # production-style via uvicorn directly

The actual FastAPI application lives in app/main.py (package structure).
This wrapper is a convenience shim so IDEs, Procfiles, and junior devs
all find a familiar `app.py` at the project root.
"""
import os
import sys

# Ensure the backend directory is on the path when running directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app as application  # noqa: E402 — re-export for uvicorn


def run():
    """Run development server with hot-reload."""
    try:
        import uvicorn
    except ImportError:
        print("uvicorn not found. Run: pip install uvicorn[standard]")
        sys.exit(1)

    uvicorn.run(
        "app:application",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        reload_dirs=[os.path.dirname(__file__)],
        log_level="info",
    )


# Also expose as `app` for gunicorn / any WSGI-adjacent runner
app = application

if __name__ == "__main__":
    run()
