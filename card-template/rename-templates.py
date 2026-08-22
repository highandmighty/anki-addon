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

TEMPLATE_RENAMES = {
    "Word→Meaning": "Hebrew → Translation",
    "Translation→Word": "Translation → Hebrew",
    "Transription→Typing": "Hebrew → Spelling",
}
OLD_TEMPLATE_NAMES = {new: old for old, new in TEMPLATE_RENAMES.items()}


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


def load_notetypes() -> list[dict[str, Any]]:
    mappings_path = (
        Path(__file__).resolve().parent / "templates" / "hebrew-templates.json"
    )

    try:
        mappings = json.loads(mappings_path.read_text(encoding="utf-8"))
    except OSError as error:
        raise RuntimeError(f"Could not read {mappings_path}: {error}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Invalid JSON in {mappings_path}: {error}") from error

    return list(mappings.values())


def build_plan(notetypes: list[dict[str, Any]], url: str) -> list[dict[str, str]]:
    plan = []

    for notetype in notetypes:
        notetype_name = notetype["notetype"]
        templates = anki_connect(
            "modelTemplates",
            {"modelName": notetype_name},
            url,
        )
        current_names = set(templates)

        for new_name in notetype["templates"].values():
            try:
                old_name = OLD_TEMPLATE_NAMES[new_name]
            except KeyError as error:
                raise RuntimeError(
                    f"No old template name is configured for {new_name!r}"
                ) from error

            has_old = old_name in current_names
            has_new = new_name in current_names

            if has_old and has_new:
                raise RuntimeError(
                    f"{notetype_name!r} contains both {old_name!r} and "
                    f"{new_name!r}; resolve the conflict manually"
                )
            if has_old:
                plan.append(
                    {
                        "notetype": notetype_name,
                        "old": old_name,
                        "new": new_name,
                    }
                )
            elif not has_new:
                raise RuntimeError(
                    f"{notetype_name!r} contains neither {old_name!r} nor "
                    f"{new_name!r}"
                )

    return plan


def print_plan(plan: list[dict[str, str]]) -> None:
    if not plan:
        print("All Hebrew card templates already use the new names.")
        return

    print("No changes will be made without --apply.\n")
    for rename in plan:
        print(
            f"- {rename['notetype']}: "
            f"{rename['old']} → {rename['new']}"
        )


def apply_renames(plan: list[dict[str, str]], url: str) -> None:
    if not plan:
        print("All Hebrew card templates already use the new names.")
        return

    for rename in plan:
        anki_connect(
            "modelTemplateRename",
            {
                "modelName": rename["notetype"],
                "oldTemplateName": rename["old"],
                "newTemplateName": rename["new"],
            },
            url,
        )
        print(
            f"Renamed {rename['notetype']}: "
            f"{rename['old']} → {rename['new']}"
        )

    for notetype_name in {rename["notetype"] for rename in plan}:
        templates = anki_connect(
            "modelTemplates",
            {"modelName": notetype_name},
            url,
        )
        expected_names = {
            rename["new"]
            for rename in plan
            if rename["notetype"] == notetype_name
        }
        missing_names = expected_names - set(templates)
        if missing_names:
            names = ", ".join(sorted(missing_names))
            raise RuntimeError(
                f"Rename verification failed for {notetype_name!r}; "
                f"missing: {names}"
            )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Rename card templates in every Hebrew Anki note type."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="apply the renames through AnkiConnect; otherwise only show the plan",
    )
    parser.add_argument(
        "--url",
        default=ANKI_CONNECT_URL,
        help=f"AnkiConnect URL (default: {ANKI_CONNECT_URL})",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        plan = build_plan(load_notetypes(), args.url)
        if args.apply:
            apply_renames(plan, args.url)
        else:
            print_plan(plan)
    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
