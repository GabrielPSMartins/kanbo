from datetime import datetime

from sqlalchemy import Enum as SAEnum


def now() -> datetime:
    """Horário local sem timezone: app single-user rodando na máquina do usuário,
    então 'hoje' para burndown/prazos é o dia local."""
    return datetime.now().replace(microsecond=0)


def str_enum(enum_cls) -> SAEnum:
    # Guardado como VARCHAR (sem tipo ENUM nativo) para ser portátil entre SQLite e Postgres
    return SAEnum(
        enum_cls,
        native_enum=False,
        length=20,
        values_callable=lambda e: [m.value for m in e],
        validate_strings=True,
    )
