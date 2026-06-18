#!/usr/bin/env python3
"""
Corrige deux problèmes dans lfy_import.json :
  1. Encodage mojibake (octets UTF-8 lus comme Latin-1) sur tous les textes.
  2. Équipement "other" → "none" (méthode "sans matériel" = poids du corps).

Utilisation (depuis la racine du repo ou n'importe où) :
    python scripts/fix_lfy_encoding.py

Le fichier est modifié sur place.
"""
import json
import sys

IMPORT_PATH = r'C:\Users\EloRaf\Documents\lfy_pages\lfy_import.json'


def fix_mojibake(s: str) -> str:
    """Inverse le mojibake cp1252 -> utf-8.

    cp1252 (Windows-1252) couvre les octets 0x80-0x9F absents de latin-1 pur,
    notamment euro=0x80 et guillemet=0x94. Ces octets apparaissent dans la
    reconstitution de l'em-dash (UTF-8: E2 80 94) ou des guillemets anglais.
    Sans cp1252, encode('latin-1') echoue des que la chaine contient un de
    ces caracteres, et la correction est silencieusement abandonnee.
    """
    try:
        return s.encode('cp1252').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


def walk(obj: object) -> object:
    """Applique fix_mojibake récursivement à toutes les chaînes."""
    if isinstance(obj, str):
        return fix_mojibake(obj)
    if isinstance(obj, list):
        return [walk(item) for item in obj]
    if isinstance(obj, dict):
        return {k: walk(v) for k, v in obj.items()}
    return obj


def main() -> None:
    print(f"Lecture de {IMPORT_PATH} …")
    try:
        with open(IMPORT_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"ERREUR : fichier introuvable → {IMPORT_PATH}", file=sys.stderr)
        sys.exit(1)

    # 1. Correction encodage (toutes les valeurs texte)
    data = walk(data)

    # 2. Correction équipement exercices : "other" → "none"
    nb_ex = 0
    for ex in data.get('exercises', []):
        if ex.get('equipment') == 'other':
            ex['equipment'] = 'none'
            nb_ex += 1

    # 3. Correction équipement programmes : ["other"] → ["none"]
    nb_prog = 0
    for prog in data.get('programs', []):
        before = prog.get('equipment', [])
        after = ['none' if e == 'other' else e for e in before]
        if after != before:
            prog['equipment'] = after
            nb_prog += 1

    print(f"Écriture …")
    with open(IMPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    total_ex = len(data.get('exercises', []))
    total_prog = len(data.get('programs', []))
    print(f"✓ Terminé.")
    print(f"  Exercices traités : {total_ex}  (équipement corrigé : {nb_ex})")
    print(f"  Programmes traités : {total_prog}  (équipement corrigé : {nb_prog})")
    print(f"  Fichier mis à jour : {IMPORT_PATH}")


if __name__ == '__main__':
    main()
