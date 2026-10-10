#!/usr/bin/env python3
"""Valida a estrutura de orquestração de agentes do projeto.

Uso: python3 scripts/validar_estrutura.py [--grupo base|docs|skills|agentes|comandos]
Sem argumento valida todos os grupos. Sai com 0 se estiver tudo certo, 1 caso contrário.
"""
import argparse
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

SKILLS = [
    "carregar-contexto", "atualizar-tarefa", "definition-of-done", "registrar-decisao",
    "nota-de-estudo", "commit-convencional", "apresentar-decisao",
    "orquestrar-tarefa", "levantar-requisitos",
]
AGENTES = ["dev", "code-reviewer", "qa", "instrutor", "devops"]
COMANDOS = ["nova-tarefa", "executar-tarefa", "estudar"]
DOCS = [
    "docs/00-visao/README.md", "docs/01-requisitos/README.md", "docs/02-arquitetura/README.md",
    "docs/03-tarefas/backlog.md", "docs/04-estudos/README.md",
    "docs/_templates/tarefa.md", "docs/_templates/adr.md", "docs/_templates/nota-estudo.md",
]
CHAVES_TAREFA = ["id", "titulo", "status", "modo", "tags", "rodadas", "criada"]
SECOES_TAREFA = ["Descrição", "Critérios de aceite", "Contexto relevante", "Decisões",
                 "Dev", "Revisão", "QA", "Estudo", "DevOps", "Log"]


def ler_frontmatter(caminho: Path) -> tuple[dict, str]:
    """Retorna (frontmatter, corpo). Suporta 'chave: valor', listas '- item' e '[a, b]'."""
    texto = caminho.read_text(encoding="utf-8")
    linhas = texto.splitlines()
    if not linhas or linhas[0].strip() != "---":
        return {}, texto
    dados: dict = {}
    chave_atual = None
    for i, linha in enumerate(linhas[1:], start=1):
        if linha.strip() == "---":
            return dados, "\n".join(linhas[i + 1:])
        if linha.lstrip().startswith("- ") and chave_atual:
            if not isinstance(dados.get(chave_atual), list):
                dados[chave_atual] = []
            dados[chave_atual].append(linha.strip()[2:].strip().strip("\"'"))
            continue
        if ":" in linha and not linha.startswith(" "):
            chave, valor = linha.split(":", 1)
            chave_atual = chave.strip()
            valor = valor.strip()
            if valor.startswith("[") and valor.endswith("]"):
                dados[chave_atual] = [v.strip().strip("\"'") for v in valor[1:-1].split(",") if v.strip()]
            else:
                dados[chave_atual] = valor.strip("\"'")
    return dados, ""


def existe(rel: str, erros: list) -> bool:
    if not (RAIZ / rel).is_file():
        erros.append(f"FALTA: {rel}")
        return False
    return True


def validar_base(erros: list) -> None:
    for rel in ["AGENTS.md", "CLAUDE.md", ".gitignore", ".obsidian/app.json", ".obsidian/templates.json"]:
        existe(rel, erros)
    claude = RAIZ / "CLAUDE.md"
    if claude.is_file() and "@AGENTS.md" not in claude.read_text(encoding="utf-8"):
        erros.append("ERRO: CLAUDE.md não importa @AGENTS.md")


def validar_docs(erros: list) -> None:
    for rel in DOCS:
        existe(rel, erros)
    tarefa = RAIZ / "docs/_templates/tarefa.md"
    if tarefa.is_file():
        fm, corpo = ler_frontmatter(tarefa)
        for chave in CHAVES_TAREFA:
            if chave not in fm:
                erros.append(f"ERRO: template tarefa.md sem a chave '{chave}'")
        for secao in SECOES_TAREFA:
            if f"## {secao}" not in corpo.splitlines():
                erros.append(f"ERRO: template tarefa.md sem a seção '## {secao}'")
    backlog = RAIZ / "docs/03-tarefas/backlog.md"
    if backlog.is_file() and "T-001" not in backlog.read_text(encoding="utf-8"):
        erros.append("ERRO: backlog.md não contém T-001")


def validar_skills(erros: list) -> None:
    for nome in SKILLS:
        rel = f".claude/skills/{nome}/SKILL.md"
        if not existe(rel, erros):
            continue
        fm, _ = ler_frontmatter(RAIZ / rel)
        if fm.get("name") != nome:
            erros.append(f"ERRO: skill {nome} com name '{fm.get('name')}' diferente da pasta")
        if not fm.get("description"):
            erros.append(f"ERRO: skill {nome} sem description")


def validar_agentes(erros: list) -> None:
    for nome in AGENTES:
        rel = f".claude/agents/{nome}.md"
        if not existe(rel, erros):
            continue
        fm, corpo = ler_frontmatter(RAIZ / rel)
        for campo in ["name", "description", "tools"]:
            if not fm.get(campo):
                erros.append(f"ERRO: agente {nome} sem '{campo}'")
        if fm.get("model") != "inherit":
            erros.append(f"ERRO: agente {nome} com model '{fm.get('model')}' (esperado inherit)")
        skills = fm.get("skills") or []
        if isinstance(skills, str):
            skills = [skills]
        for skill in skills:
            if not (RAIZ / f".claude/skills/{skill}/SKILL.md").is_file():
                erros.append(f"ERRO: agente {nome} referencia skill inexistente {skill}")
        if "## Handoff" not in corpo:
            erros.append(f"ERRO: agente {nome} sem seção '## Handoff'")


def validar_comandos(erros: list) -> None:
    for nome in COMANDOS:
        rel = f".claude/commands/{nome}.md"
        if existe(rel, erros):
            fm, _ = ler_frontmatter(RAIZ / rel)
            if not fm.get("description"):
                erros.append(f"ERRO: comando {nome} sem description")


GRUPOS = {
    "base": validar_base, "docs": validar_docs, "skills": validar_skills,
    "agentes": validar_agentes, "comandos": validar_comandos,
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--grupo", choices=list(GRUPOS))
    args = parser.parse_args()
    grupos = [args.grupo] if args.grupo else list(GRUPOS)
    erros: list = []
    for grupo in grupos:
        GRUPOS[grupo](erros)
    if erros:
        print("\n".join(erros))
        return 1
    print(f"OK: estrutura válida ({', '.join(grupos)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
