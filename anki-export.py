import sqlite3
import json
import tempfile
import os
from pprint import pprint
import urllib.parse


# TODO: backup function doesn't work:(
def backup_db(anki_path):
    # print(os.path.exists(anki_path), os.access(anki_path, os.R_OK))
    # print(repr(urllib.parse.quote(anki_path, safe="/")))

    src = sqlite3.connect(
        "file:/Users/noideaatall/Library/Application%20Support/Anki2/User%201/collection.anki2?mode=ro",
        uri=True,
        timeout=5.0
    )
    snap_path = os.path.join(tempfile.gettempdir(), 'anki_snapshot.sqlite')
    # snap_path = '/Users/noideaatall/_trash/anki_snapshot.sqlite'
    dst = sqlite3.connect(snap_path)
    src.backup(dst)  # consistent snapshot even if Anki is writing
    src.close()
    dst.close()

    return snap_path


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
    x = 1
    for nid, flds, tags, notetype, modified in data:
        fields = flds.split("\x1f")
        notes.append(
            {
                "id": x, "fields": fields,
                "tags": tags, "notetype": notetype, "modified": modified
            })
        x += 1

    # pprint(notes)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)
    
    conn.close()


if __name__ == '__main__':
    # anki_collection = "/Users/noideaatall/Library/Application Support/Anki2/User 1/collection.anki2"
    anki_collection = "/Users/noideaatall/_trash/collection.anki2"
    # anki_copy = backup_db(anki_collection)
    # print(anki_copy)
   
    export_anki_json(anki_collection, "/Users/noideaatall/_temp/anki-addon/docs/anki-table.json")
