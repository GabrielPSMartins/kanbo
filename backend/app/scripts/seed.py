"""Popula o banco com o projeto TCC de exemplo.

Uso: uv run python -m app.scripts.seed [--reset]

As datas são relativas a hoje: uma sprint fechada, uma ativa em andamento e uma planejada.
O histórico (ActivityLog) é gerado retroativamente para o burndown ter forma real.
"""

import argparse
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models import (
    ActivityAction,
    ActivityLog,
    ChecklistItem,
    Epic,
    Issue,
    IssuePriority,
    IssueStatus,
    IssueType,
    Label,
    Project,
    Sprint,
    SprintStatus,
)
from app.repositories.projects import get_by_key

TODAY = date.today()
SPRINT_LEN = 14

# Sprint 1 (fechada) → Sprint 2 (ativa, termina em 4 dias) → Sprint 3 (planejada)
S1_START = TODAY - timedelta(days=24)
S2_START = S1_START + timedelta(days=SPRINT_LEN)
S3_START = S2_START + timedelta(days=SPRINT_LEN)


def at(d: date, hour: int = 10) -> datetime:
    return datetime.combine(d, time(hour, 0))


@dataclass
class Spec:
    title: str
    type: IssueType
    epic: str | None
    points: int | None
    priority: IssuePriority
    sprint: str | None  # "s1" | "s2" | "s3" | None (backlog)
    status: IssueStatus
    # dia (a partir do início da sprint) em que ficou pronta; None = não concluída
    done_day: int | None = None
    labels: list[str] = field(default_factory=list)
    due_in: int | None = None  # dias a partir de hoje
    checklist: list[tuple[str, bool]] = field(default_factory=list)
    carried_over: bool = False  # veio da sprint 1 (não concluída lá)
    description: str = ""


T, S, B, R = IssueType.task, IssueType.story, IssueType.bug, IssueType.research
U, H, M, L, N = (
    IssuePriority.urgent,
    IssuePriority.high,
    IssuePriority.medium,
    IssuePriority.low,
    IssuePriority.none,
)
BK, TD, IP, RV, DN = (
    IssueStatus.backlog,
    IssueStatus.todo,
    IssueStatus.in_progress,
    IssueStatus.review,
    IssueStatus.done,
)

CAP2, API, APR = "cap2", "api", "apr"

# fmt: off
SPECS: list[Spec] = [
    # --- Sprint 1 (fechada) ---
    Spec("Definir escopo do referencial teórico", T, CAP2, 3, H, "s1", DN, 2, ["escrita"]),
    Spec("Levantar artigos sobre metodologias ágeis", R, CAP2, 5, H, "s1", DN, 5, ["pesquisa"],
         checklist=[("IEEE Xplore", True), ("ACM DL", True), ("Google Scholar", True)]),
    Spec("Fichamento: Scrum Guide 2020", R, CAP2, 2, M, "s1", DN, 6, ["pesquisa"]),
    Spec("Modelar entidades do domínio", S, API, 5, H, "s1", DN, 8, ["código"]),
    Spec("Configurar projeto FastAPI + SQLite", T, API, 3, M, "s1", DN, 9, ["código"]),
    Spec("Reunião de alinhamento com orientador", T, None, 1, M, "s1", DN, 10, ["orientador"]),
    Spec("Escrever seção 2.1 – Gestão de projetos", S, CAP2, 5, M, "s1", DN, 12, ["escrita"]),
    # --- Sprint 2 (ativa) ---
    Spec("Escrever seção 2.2 – Frameworks ágeis", S, CAP2, 8, H, "s2", IP, None, ["escrita"],
         carried_over=True, due_in=3,
         checklist=[("Scrum", True), ("Kanban", True), ("XP", False), ("Comparativo", False)],
         description="Cobrir **Scrum**, **Kanban** e **XP**, com tabela comparativa no fim."),
    Spec("Endpoints de issues e sprints", S, API, 5, H, "s2", DN, 3, ["código"]),
    Spec("Testes automatizados do backend", T, API, 3, M, "s2", DN, 5, ["código"]),
    Spec("Corrigir cálculo de datas da sprint", B, API, 2, U, "s2", DN, 6, ["código", "bug"]),
    Spec("Revisão ortográfica do capítulo 1", T, None, 2, L, "s2", DN, 8, ["revisão"]),
    Spec("Burndown chart no frontend", S, API, 5, M, "s2", RV, None, ["código"]),
    Spec("Seção 2.3 – Trabalhos relacionados", S, CAP2, 5, H, "s2", IP, None, ["escrita"],
         due_in=5),
    Spec("Enviar versão parcial ao orientador", T, None, 1, U, "s2", TD, None, ["orientador"],
         due_in=-1),
    Spec("Ajustar referências para ABNT", T, CAP2, 2, M, "s2", TD, None, ["escrita", "revisão"],
         due_in=6),
    Spec("Bug: drag-and-drop duplica card", B, API, 3, H, "s2", TD, None, ["código", "bug"]),
    # --- Sprint 3 (planejada) ---
    Spec("Roteiro da apresentação", S, APR, 3, M, "s3", TD, None, ["apresentação"]),
    Spec("Slides: introdução e problema", T, APR, 3, M, "s3", TD, None, ["apresentação"]),
    Spec("Deploy da aplicação", T, API, 2, L, "s3", TD, None, ["código"]),
    Spec("Revisar capítulo 2 completo", T, CAP2, 5, H, "s3", TD, None, ["revisão"]),
    # --- Backlog ---
    Spec("Slides: resultados e conclusão", T, APR, 3, L, None, BK, None, ["apresentação"]),
    Spec("Ensaiar apresentação (cronometrado)", T, APR, 2, L, None, BK, None, ["apresentação"]),
    Spec("Pesquisar ferramentas de métricas ágeis", R, CAP2, None, N, None, BK, None, ["pesquisa"]),
    Spec("Exportar relatório de sprint em PDF", S, API, 8, L, None, BK, None, ["código"]),
    Spec("Glossário de termos", T, CAP2, 1, N, None, BK, None, ["escrita"]),
]
# fmt: on

LABELS = {
    "escrita": "#3B82F6",
    "pesquisa": "#A855F7",
    "código": "#22C55E",
    "revisão": "#EAB308",
    "orientador": "#F97316",
    "bug": "#EF4444",
    "apresentação": "#EC4899",
}


def _log(issue: Issue, action: ActivityAction, frm, to, when: datetime) -> None:
    def fmt(v):
        return None if v is None else str(getattr(v, "value", v))

    issue.activity.append(
        ActivityLog(action=action.value, from_value=fmt(frm), to_value=fmt(to), created_at=when)
    )


def seed(db: Session, reset: bool = False) -> Project:
    existing = get_by_key(db, "TCC")
    if existing:
        if not reset:
            print("Projeto TCC já existe (use --reset para recriar).")
            return existing
        db.delete(existing)
        db.commit()

    project = Project(
        name="TCC",
        key="TCC",
        description="Trabalho de Conclusão de Curso — gestão ágil de projetos pessoais.",
        color="#6366F1",
        created_at=at(S1_START - timedelta(days=3)),
    )
    db.add(project)

    epics = {
        CAP2: Epic(
            title="Capítulo 2 – Referencial teórico",
            color="#3B82F6",
            description="Revisão bibliográfica sobre gestão ágil.",
        ),
        API: Epic(
            title="Backend da API",
            color="#22C55E",
            description="Protótipo do sistema desenvolvido no TCC.",
        ),
        APR: Epic(
            title="Apresentação", color="#EC4899", description="Slides e ensaio para a banca."
        ),
    }
    project.epics.extend(epics.values())
    labels = {name: Label(name=name, color=color) for name, color in LABELS.items()}
    project.labels.extend(labels.values())

    s1 = Sprint(
        name="Sprint 1",
        goal="Fechar escopo e estruturar o referencial teórico",
        start_date=S1_START,
        end_date=S1_START + timedelta(days=SPRINT_LEN - 1),
        status=SprintStatus.closed,
        started_at=at(S1_START, 9),
        closed_at=at(S2_START - timedelta(days=1), 18),
    )
    s2 = Sprint(
        name="Sprint 2",
        goal="Concluir seções 2.2 e 2.3 e a API de sprints",
        start_date=S2_START,
        end_date=S2_START + timedelta(days=SPRINT_LEN - 1),
        status=SprintStatus.active,
        started_at=at(S2_START, 9),
    )
    s3 = Sprint(
        name="Sprint 3",
        goal="Preparar apresentação e revisar capítulo 2",
        start_date=S3_START,
        end_date=S3_START + timedelta(days=SPRINT_LEN - 1),
        status=SprintStatus.planned,
    )
    project.sprints.extend([s1, s2, s3])
    db.flush()
    sprints = {"s1": s1, "s2": s2, "s3": s3}

    positions: dict[str | None, float] = {}
    for n, spec in enumerate(SPECS, start=1):
        sprint = sprints.get(spec.sprint) if spec.sprint else None
        pos = positions.get(spec.sprint, 0.0) + 1024
        positions[spec.sprint] = pos

        if spec.carried_over:
            first_sprint, created = s1, at(S1_START - timedelta(days=2))
        elif sprint is not None and sprint.started_at:
            first_sprint, created = sprint, at(sprint.start_date - timedelta(days=2))
        else:
            first_sprint, created = sprint, at(TODAY - timedelta(days=30 - n % 10))

        issue = Issue(
            project=project,
            number=n,
            title=spec.title,
            description=spec.description,
            type=spec.type,
            priority=spec.priority,
            story_points=spec.points,
            epic=epics[spec.epic] if spec.epic else None,
            labels=[labels[x] for x in spec.labels],
            due_date=TODAY + timedelta(days=spec.due_in) if spec.due_in is not None else None,
            position=pos,
            created_at=created,
            updated_at=created,
            status=BK,
            sprint=None,
        )
        _log(issue, ActivityAction.created, None, BK, created)

        # planejamento: entra na sprint 2 dias antes do início (antes do start)
        if first_sprint is not None:
            _log(issue, ActivityAction.moved_to_sprint, None, first_sprint.id, created)
            _log(issue, ActivityAction.status_changed, BK, TD, created)
            issue.sprint, issue.status = first_sprint, TD

        if spec.carried_over:
            # andou na sprint 1 mas não terminou → foi para a sprint 2 no fechamento
            _log(issue, ActivityAction.status_changed, TD, IP, at(S1_START + timedelta(days=7)))
            issue.status = IP
            _log(issue, ActivityAction.moved_to_sprint, s1.id, s2.id, s1.closed_at)
            issue.sprint = s2

        if sprint is not None and sprint.start_date and sprint.start_date <= TODAY:
            start = sprint.start_date
            if spec.done_day is not None:
                d_ip = start + timedelta(days=max(spec.done_day - 2, 0))
                d_done = start + timedelta(days=spec.done_day)
                if issue.status == TD:
                    _log(issue, ActivityAction.status_changed, TD, IP, at(d_ip, 9))
                _log(issue, ActivityAction.status_changed, IP, DN, at(d_done, 17))
                issue.status, issue.completed_at = DN, at(d_done, 17)
                issue.updated_at = issue.completed_at
            elif spec.status in (IP, RV) and issue.status == TD:
                _log(issue, ActivityAction.status_changed, TD, IP, at(TODAY - timedelta(days=3)))
                issue.status = IP
            if spec.status == RV:
                _log(issue, ActivityAction.status_changed, IP, RV, at(TODAY - timedelta(days=1)))
                issue.status = RV

        for i, (text, done) in enumerate(spec.checklist, start=1):
            issue.checklist.append(ChecklistItem(text=text, done=done, position=i * 1024.0))
        db.add(issue)

    # mudança de escopo no meio da sprint ativa (aparece no burndown)
    db.flush()
    scope_bump = next(i for i in project.issues if i.title.startswith("Bug: drag"))
    _log(scope_bump, ActivityAction.points_changed, 2, 3, at(S2_START + timedelta(days=4), 15))

    project.issue_counter = len(SPECS)
    s1.committed_points = sum((s.points or 0) for s in SPECS if s.sprint == "s1" or s.carried_over)
    s1.completed_points = sum((s.points or 0) for s in SPECS if s.sprint == "s1")
    # escopo no início da sprint 2 (antes do bug ser re-estimado de 2 → 3)
    s2.committed_points = sum((s.points or 0) for s in SPECS if s.sprint == "s2") - 1
    db.commit()
    print(
        f"Seed OK: projeto TCC com {len(SPECS)} issues, {len(epics)} epics, "
        f"{len(labels)} labels e 3 sprints."
    )
    return project


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="apaga e recria o projeto TCC")
    args = parser.parse_args()
    with SessionLocal() as db:
        seed(db, reset=args.reset)


if __name__ == "__main__":
    main()
