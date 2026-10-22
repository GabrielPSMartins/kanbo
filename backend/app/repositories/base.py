from sqlalchemy.orm import Session

from app.core.errors import NotFoundError


def get_or_404[M](db: Session, model: type[M], obj_id: int, name: str | None = None) -> M:
    obj = db.get(model, obj_id)
    if obj is None:
        raise NotFoundError(f"{name or model.__name__} {obj_id} não encontrado")
    return obj
