import json
import os
import re
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QClipboard

from aqt import gui_hooks

from aqt import mw
from aqt import dialogs
from aqt.utils import showInfo

addon_path = os.path.dirname(__file__)


def paste_clipboard():
    clipboard = QApplication.clipboard()
    return clipboard.text(mode=QClipboard.Mode.Clipboard)


def insert_html_into_editor(editor, html):
    js = f"document.execCommand('insertHTML', false, {json.dumps(html)});"  
    editor.web.eval(js)


def strip_niqqud(text):
    def is_allowed(num):
        # 59 — semicolon (;)
        # 1524 — Hebrew quotes (״)
        return (num <= 1000 and num != 59) or \
            num == 1470 or \
            1488 <= num <= 1514 or \
            num == 1524

    chars = [c for c in text if is_allowed(ord(c))]
    new_text = "".join(chars)

    return new_text


# Flusing niqqudot
def flush_niqqud(editor):
    # Seems that .selectedText() strips any HTML inc. <br>
    selected = editor.web.selectedText()

    if selected:
        new_text = strip_niqqud(selected)
        new_text = new_text.replace("\n", "<br>")

        insert_html_into_editor(editor, new_text)


# Correcting transcription to Russian
def change_transcript(editor):
    # Seems that .selectedText() strips any HTML inc. <br>
    selected = editor.web.selectedText()

    if selected:
        new_text = selected.replace("е", "э").replace("х", "кх").replace("я", "йа")
        new_text = new_text.replace("\n", "<br>")

        insert_html_into_editor(editor, new_text)


# Browser search
def open_browser(editor):
    # Getting current note from mv, not editor
    if hasattr(mw.app.activeWindow(), "editor"):
        current_editor = mw.app.activeWindow().editor
    else:
        showInfo("No editor found")
        return

    if current_editor and current_editor.note:
        current_note = current_editor.note
    else:
        showInfo("No note is currently being edited")
        return

    if "Root" in current_note:
        root = current_note["Root"]
        if not root:
            showInfo("'Root' field is not set")
            return
    else:
        showInfo("No 'Root' field in the note")
        return

    # Open the browser window
    browser = dialogs.open("Browser", mw)

    # Getting current search and creating query
    search = browser.form.searchEdit.lineEdit().text()
    search = "".join([s for s in search.split(" ") if "deck:" in s])

    if strip_niqqud(root) != root:
        root_query = f'(Root:"*{root}*" OR Root:"*{strip_niqqud(root)}*")'
    else:
        root_query = f'Root:"*{root}*"'

    query = f'{search} {root_query}' if search else root_query
    
    # Checking if search will work
    note_ids = mw.col.find_notes(query)

    if len(note_ids) < 2:
        showInfo(f"No more notes with root '{root}'")
        return

    # Set the search query in the browser's search bar
    browser.form.searchEdit.lineEdit().setText(query)

    # Trigger the search
    browser.onSearchActivated()


def paste_hebrew(editor):
    # List from clipboard could be:
    # Word, Niqqud, Transcription, Root
    # Niqqud, Transcription, Root
    # Word, Niqqud, Transcription
    # Niqqud, Transcription

    clipboard = paste_clipboard()
    if not clipboard:
        showInfo("Clipboard data is not available.")
        return

    if "{" not in clipboard:
        showInfo("Clipboard data is incorrect.")
        return

    clipboard_dict = json.loads(clipboard)

    if "Niqqud" not in clipboard_dict or "Transcription" not in clipboard_dict:
        showInfo("Clipboard data is incorrect.")
        return

    allowed_keys = ["Root", "Niqqud", "Transcription", "Word"]
    fields = {k: v for k, v in clipboard_dict.items() if k in allowed_keys}

    if "Word" not in clipboard_dict:
        fields['Word'] = strip_niqqud(clipboard_dict["Niqqud"])
    
    for field, text in fields.items():
        if field in editor.note:
            editor.note[field] = text
    editor.loadNote()


# Adding buttons to interface
def setup_editor_buttons(buttons, editor):

    flush_button = editor.addButton(
        os.path.join(addon_path, "aleph.png"),
        "FlushNiqqud",
        flush_niqqud,
        tip="Removes niqquds from selected text"
    )

    root_button = editor.addButton(
        os.path.join(addon_path, "search.svg"),
        "Search Root",
        open_browser,
        tip="Searches for Root in current deck"
    )

    transcript_button = editor.addButton(
        os.path.join(addon_path, "correct.svg"),
        "ChangeTranscript",
        change_transcript,
        tip="Corrects transcription"
    )

    paste_button = editor.addButton(
        os.path.join(addon_path, "paste.svg"),
        "PasteHebrew",
        paste_hebrew,
        tip="Pastes Hebrew word from clipboard"
    )

    buttons.append(flush_button)
    buttons.append(transcript_button)
    buttons.append(root_button)
    buttons.append(paste_button)

    return buttons


gui_hooks.editor_did_init_buttons.append(setup_editor_buttons)


# ---
# Enclosing numbers in circles and replacing semicolons
# ---
def enclose_numbers(text: str) -> str:
    circled_numbers = {
        "(1)": "①",
        "(2)": "②",
        "(3)": "③",
        "(4)": "④",
        "(5)": "⑤",
        "(6)": "⑥",
        "(7)": "⑦",
        "(8)": "⑧",
        "(9)": "⑨",
        "(10)": "⑩"
    }

    # Function defined as re.sub agrument
    # See: https://docs.python.org/3/library/re.html#re.sub
    def replacer(match):
        return circled_numbers.get(match.group(0), match.group(0))

    return re.sub(r'\(\d{1,2}\)', replacer, text)


def span_semicolons(text: str) -> str:
    # Search Anki: Niqqud:re:<br> -Niqqud:re:;
    pattern = r'\;<br>'  # (?<!<span>)\;(?!<\/span>)
    return re.sub(pattern, '<span>;</span><br>', text)


def on_editor_replace_circles(text: str, editor_instance) -> str:
    return enclose_numbers(text)


def on_editor_replace_semicolons(text: str, editor_instance) -> str:
    return span_semicolons(text)


gui_hooks.editor_will_munge_html.append(on_editor_replace_circles)
gui_hooks.editor_will_munge_html.append(on_editor_replace_semicolons)
