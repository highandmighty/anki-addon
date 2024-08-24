import json
import os

from aqt import gui_hooks

from aqt import mw
from aqt import dialogs
from aqt.utils import showInfo

addon_path = os.path.dirname(__file__)


def insert_html_into_editor(editor, html):
    js = f"document.execCommand('insertHTML', false, {json.dumps(html)});"  
    editor.web.eval(js)


def strip_niqqud(text):
    chars = [c for c in text if (1488 <= ord(c) <= 1514) or ord(c) <= 1000 or ord(c) == 1470]
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
        new_text = selected.replace("е", "э").replace("х", "кх")
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

    buttons.append(flush_button)
    buttons.append(root_button)
    buttons.append(transcript_button)

    return buttons


gui_hooks.editor_did_init_buttons.append(setup_editor_buttons)
