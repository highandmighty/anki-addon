import sqlite3
import json
# import os
from pprint import pprint
import urllib.parse


def backup_db():
    ANKI_DB = "/Users/noideaatall/Library/Application Support/Anki2/User 1/collection.anki2"

    source_conn = sqlite3.connect(ANKI_DB, timeout=5.0)
    backup_path = '/Users/noideaatall/_trash/anki_snapshot.sqlite'
    # Creates backup db if it doesn't exist
    backup_conn = sqlite3.connect(backup_path)

    with source_conn, backup_conn:
        source_conn.backup(backup_conn)

    print("Backup is made successfully")
    return backup_path


def export_anki_json(db_path, out_path):
    conn = sqlite3.connect(
        f"file:{urllib.parse.quote(db_path, safe="/")}?mode=ro",
        uri=True,
        timeout=5.0
    )
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    # adjust these fields to whatever you need:

    query = r"""
SELECT DISTINCT n.id, n.flds, n.tags, n.mid, n.mod
FROM notes AS n
JOIN cards c ON c.nid = n.id
JOIN decks d ON c.did = d.id
WHERE d.name LIKE 'Hebrew%'
AND d.name NOT LIKE '%Grammar'
AND n.mid NOT IN (1668593573595, 1668593573596)
"""
    cur.execute(query)
    data = cur.fetchall()
    # pprint(data)

    notes = []
    # x = 1
    for nid, flds, tags, notetype, modified in data:
        fields = flds.split("\x1f")
        notes.append(
            {
                "id": nid, "fields": fields,
                "tags": tags, "notetype": notetype, "modified": modified
            })
        # x += 1

    # pprint(notes)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)
    
    conn.close()
    print(f"JSON with {len(data)} entries generated successfully")


if __name__ == '__main__':
    anki_copy = backup_db()  # Anki should be closed
    anki_json = "/Users/noideaatall/_temp/anki-addon/docs/anki-table.json"
    export_anki_json(anki_copy, anki_json)
