"""Exporta o schema OpenAPI sem precisar subir o servidor.

Uso: uv run python -m app.scripts.export_openapi [arquivo]
"""

import json
import sys
from pathlib import Path

from app.main import app


def main() -> None:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "openapi.json")
    out.write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False))
    print(f"OpenAPI exportado para {out}")


if __name__ == "__main__":
    main()
