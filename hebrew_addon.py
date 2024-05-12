import json
import os

from aqt import gui_hooks

addon_path = os.path.dirname(__file__)


def insert_html_into_editor(editor, html):
    js = f"document.execCommand('insertHTML', false, {json.dumps(html)});"  
    editor.web.eval(js)


def flush_niqqud(editor):
    selected = editor.web.selectedText()

    if selected:
        chars = [c for c in selected if (1488 <= ord(c) <= 1514) or (ord(c) <= 1000)]
        new_text = "".join(chars)

        insert_html_into_editor(editor, new_text)


def setup_editor_buttons(buttons, editor):
    new_button = editor.addButton(
        os.path.join(addon_path, "aleph.png"),
        "FlushNiqqud",
        flush_niqqud,
        tip="Removes niqquds from selected text"
    )
    buttons.append(new_button)

    return buttons

gui_hooks.editor_did_init_buttons.append(setup_editor_buttons)
