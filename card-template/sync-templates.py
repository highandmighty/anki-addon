#!/usr/bin/env python3

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


ANKI_CONNECT_URL = "http://127.0.0.1:8765"
ANKI_CONNECT_VERSION = 6
SOURCE_NOTETYPE = "Hebrew (3 cards)"

TEMPLATE_FILE_STEMS = {
    "Hebrew → Translation": "hebrew-translation",
    "Translation → Hebrew": "translation-hebrew",
    "Hebrew → Spelling": "hebrew-spelling",
}


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError as error:
        raise RuntimeError(f"Could not read {path}: {error}") from error


def text_matches(left: str, right: str) -> bool:
    """Ignore one conventional trailing newline when comparing source files."""
    return left.removesuffix("\n") == right.removesuffix("\n")


def load_mappings(templates_dir: Path) -> dict[str, dict[str, Any]]:
    mappings_path = templates_dir / "hebrew-templates.json"

    try:
        return json.loads(read_text(mappings_path))
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Invalid JSON in {mappings_path}: {error}") from error


def find_source_mapping(
    mappings: dict[str, dict[str, Any]],
    mappings_path: Path,
) -> dict[str, Any]:
    source = next(
        (
            notetype
            for notetype in mappings.values()
            if notetype["notetype"] == SOURCE_NOTETYPE
        ),
        None,
    )
    if source is None:
        raise RuntimeError(f"{SOURCE_NOTETYPE!r} is missing from {mappings_path}")

    return source


def load_sync_plan(
    templates_dir: Path,
    include_source: bool = False,
) -> list[dict[str, Any]]:
    mappings_path = templates_dir / "hebrew-templates.json"
    mappings = load_mappings(templates_dir)
    source = find_source_mapping(mappings, mappings_path)

    source_css = read_text(templates_dir / source["css"])
    source_templates: dict[str, dict[str, str]] = {}

    for template_name in source["templates"].values():
        try:
            stem = TEMPLATE_FILE_STEMS[template_name]
        except KeyError as error:
            raise RuntimeError(
                f"No source filename is configured for {template_name!r}"
            ) from error

        source_templates[template_name] = {
            "Front": read_text(templates_dir / f"{stem}.front.html"),
            "Back": read_text(templates_dir / f"{stem}.back.html"),
        }

    plan = []
    for notetype_id, notetype in mappings.items():
        if notetype["notetype"] == SOURCE_NOTETYPE and not include_source:
            continue

        templates = {}
        for template_name in notetype["templates"].values():
            try:
                templates[template_name] = source_templates[template_name]
            except KeyError as error:
                raise RuntimeError(
                    f"The source note type has no matching template for "
                    f"{template_name!r}"
                ) from error

        plan.append(
            {
                "id": notetype_id,
                "name": notetype["notetype"],
                "templates": templates,
                "css": source_css,
            }
        )

    return plan


def load_pull_plan(templates_dir: Path, url: str) -> list[dict[str, Any]]:
    mappings_path = templates_dir / "hebrew-templates.json"
    mappings = load_mappings(templates_dir)
    source = find_source_mapping(mappings, mappings_path)
    live_templates = anki_connect(
        "modelTemplates",
        {"modelName": SOURCE_NOTETYPE},
        url,
    )
    live_styling = anki_connect(
        "modelStyling",
        {"modelName": SOURCE_NOTETYPE},
        url,
    )

    plan = []
    for template_name in source["templates"].values():
        if template_name not in live_templates:
            raise RuntimeError(
                f"{SOURCE_NOTETYPE!r} has no template matching {template_name!r}"
            )

        try:
            stem = TEMPLATE_FILE_STEMS[template_name]
        except KeyError as error:
            raise RuntimeError(
                f"No source filename is configured for {template_name!r}"
            ) from error

        for side, suffix in (("Front", "front"), ("Back", "back")):
            path = templates_dir / f"{stem}.{suffix}.html"
            content = live_templates[template_name][side]
            plan.append(
                {
                    "path": path,
                    "content": content,
                    "changed": not text_matches(read_text(path), content),
                }
            )

    css_path = templates_dir / source["css"]
    css = live_styling["css"]
    plan.append(
        {
            "path": css_path,
            "content": css,
            "changed": not text_matches(read_text(css_path), css),
        }
    )

    return plan


def anki_connect(action: str, params: dict[str, Any], url: str) -> Any:
    request_body = json.dumps(
        {
            "action": action,
            "version": ANKI_CONNECT_VERSION,
            "params": params,
        },
        ensure_ascii=False,
    ).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=request_body,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.load(response)
    except (urllib.error.URLError, TimeoutError) as error:
        raise RuntimeError(f"Could not connect to AnkiConnect at {url}: {error}") from error

    if payload.get("error") is not None:
        raise RuntimeError(f"AnkiConnect {action} failed: {payload['error']}")

    return payload.get("result")


def preflight(plan: list[dict[str, Any]], url: str) -> None:
    for notetype in plan:
        current_templates = anki_connect(
            "modelTemplates",
            {"modelName": notetype["name"]},
            url,
        )
        missing = set(notetype["templates"]) - set(current_templates)
        if missing:
            names = ", ".join(sorted(missing))
            raise RuntimeError(
                f"{notetype['name']!r} is missing expected templates: {names}"
            )


def apply_sync(plan: list[dict[str, Any]], url: str) -> None:
    preflight(plan, url)

    for notetype in plan:
        anki_connect(
            "updateModelTemplates",
            {
                "model": {
                    "name": notetype["name"],
                    "templates": notetype["templates"],
                }
            },
            url,
        )
        anki_connect(
            "updateModelStyling",
            {
                "model": {
                    "name": notetype["name"],
                    "css": notetype["css"],
                }
            },
            url,
        )
        print(f"Updated {notetype['name']} ({notetype['id']})")


def print_plan(plan: list[dict[str, Any]]) -> None:
    print(f"Source: {SOURCE_NOTETYPE}")
    print("No changes will be made without --apply.\n")

    for notetype in plan:
        template_names = ", ".join(notetype["templates"])
        print(f"- {notetype['name']} ({notetype['id']})")
        print(f"  Templates: {template_names}")
        print("  Styling: styles.css")


def print_pull_plan(plan: list[dict[str, Any]]) -> None:
    print(f"Pull source: Anki {SOURCE_NOTETYPE} → repository")
    print("No files will be changed without --apply.\n")

    for item in plan:
        status = "update" if item["changed"] else "unchanged"
        print(f"- {item['path'].name}: {status}")


def apply_pull(plan: list[dict[str, Any]]) -> None:
    changed = [item for item in plan if item["changed"]]
    if not changed:
        print("The exemplary repository files already match Anki.")
        return

    for item in changed:
        try:
            item["path"].write_text(item["content"], encoding="utf-8")
        except OSError as error:
            raise RuntimeError(f"Could not write {item['path']}: {error}") from error
        print(f"Updated {item['path'].name}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Synchronize other Hebrew Anki note types with the unprefixed "
            "Hebrew (3 cards) HTML templates and CSS."
        )
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="apply the changes through AnkiConnect; otherwise only show the plan",
    )
    parser.add_argument(
        "--include-source",
        action="store_true",
        help=f"also update the source note type, {SOURCE_NOTETYPE!r}",
    )
    parser.add_argument(
        "--pull-source",
        action="store_true",
        help=(
            f"pull {SOURCE_NOTETYPE!r} HTML and CSS from Anki into the "
            "unprefixed repository files"
        ),
    )
    parser.add_argument(
        "--url",
        default=ANKI_CONNECT_URL,
        help=f"AnkiConnect URL (default: {ANKI_CONNECT_URL})",
    )
    args = parser.parse_args()
    if args.pull_source and args.include_source:
        parser.error("--pull-source cannot be combined with --include-source")
    return args


def main() -> int:
    args = parse_args()
    templates_dir = Path(__file__).resolve().parent / "templates"

    try:
        if args.pull_source:
            plan = load_pull_plan(templates_dir, args.url)
            if args.apply:
                apply_pull(plan)
            else:
                print_pull_plan(plan)
        else:
            plan = load_sync_plan(templates_dir, include_source=args.include_source)
            if args.apply:
                apply_sync(plan, args.url)
            else:
                print_plan(plan)
    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
