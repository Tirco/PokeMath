import json
import re
import pathlib

base = pathlib.Path(__file__).resolve().parent.parent
js_path = base / 'alternateforms.js'
json_path = base / 'pokemon_info.json'

with open(json_path, 'r', encoding='utf-8') as f:
    p_info = json.load(f)

# parse alternateforms.js for unique event forms
text = js_path.read_text(encoding='utf-8')

# extract JS object text

def extract_js_object(src: str, varname: str) -> str:
    marker = f"var {varname}"
    idx = src.find(marker)
    if idx == -1:
        raise ValueError(f"Could not find variable {varname}")
    idx = src.find('=', idx)
    idx = src.find('{', idx)
    depth = 0
    i = idx
    while i < len(src):
        ch = src[i]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return src[idx : i + 1]
        i += 1
    raise ValueError(f"Could not find matching brace for {varname}")

alt_text = extract_js_object(text, 'alternateFormsData')
evt_text = extract_js_object(text, 'eventData')

# make JS text JSON-parseable

def js_to_json(js_text: str) -> str:
    # remove trailing commas before } or ]
    return re.sub(r',\s*([}\]])', r'\1', js_text)

alt_obj = json.loads(js_to_json(alt_text))
evt_obj = json.loads(js_to_json(evt_text))

# Build imageid map from existing pokemon_info
existing_imageids = set()
for forms in p_info.values():
    for entry in forms.values():
        if isinstance(entry, dict):
            imageid = entry.get('imageid')
            if imageid is not None:
                existing_imageids.add(int(imageid))

# Collect missing unique forms from eventData
missing_forms = []  # (base_id, event_key, entry)

for event_key, bases in evt_obj.items():
    if event_key != 'unique':
        continue
    for base_id, forms in bases.items():
        for form_id, entry in forms.items():
            imageid = entry.get('imageid')
            if imageid is None:
                continue
            if int(imageid) not in existing_imageids:
                missing_forms.append((base_id, event_key, entry))

if not missing_forms:
    print('No missing unique forms found.')
    raise SystemExit(0)

print('Missing unique forms:', len(missing_forms))
for base_id, event_key, entry in missing_forms:
    print(' ', base_id, entry.get('name'), entry.get('imageid'))

# Helper to slugify

def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip('-')
    return s

# Insert missing forms into pokemon_info
for base_id, event_key, entry in missing_forms:
    base_id_str = str(base_id)
    if base_id_str not in p_info:
        print('WARNING: base id not found in pokemon_info:', base_id_str)
        continue

    base_forms = p_info[base_id_str]
    # copy base form (key '0') if exists, otherwise use first entry
    base_form = base_forms.get('0') or next(iter(base_forms.values()))
    if base_form is None:
        print('WARNING: no base form for', base_id_str)
        continue

    # find next available form index (as string)
    existing_keys = [int(k) for k in base_forms.keys() if k.isdigit()]
    next_idx = max(existing_keys) + 1 if existing_keys else 0

    new_entry = dict(base_form)
    # update fields for this unique form
    new_entry['name'] = entry.get('name') or new_entry.get('name')
    new_entry['imageid'] = int(entry.get('imageid'))
    # create slug based on base slug + event
    base_slug = base_form.get('slug', str(base_id_str))
    new_slug = slugify(f"{base_slug} {entry.get('name', '')}")
    new_entry['slug'] = new_slug
    new_entry['types'] = entry.get('types') or new_entry.get('types')

    new_entry['enabled'] = True
    new_entry['catchable'] = False
    new_entry['is_event'] = True
    new_entry['is_form'] = False
    new_entry['event'] = event_key.capitalize()
    new_entry['abundance'] = None
    new_entry['hatch_counter'] = None
    new_entry['form_item'] = ''
    new_entry['spawn_time'] = ''
    new_entry['spawn_season'] = ''
    # make sure evo fields are null for events
    for k in ['evo_to', 'evo_from', 'evo_mega', 'evo_mega_x', 'evo_mega_y']:
        new_entry[k] = None
    new_entry['name_ja'] = ''
    new_entry['name_de'] = ''
    new_entry['name_fr'] = ''
    new_entry['description'] = ''

    base_forms[str(next_idx)] = new_entry
    existing_imageids.add(int(entry.get('imageid')))
    print('Added missing form', base_id_str, '->', next_idx, new_entry['name'], new_entry['imageid'])

# Write back JSON with pretty indent
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(p_info, f, indent=4, ensure_ascii=False)

print('Updated pokemon_info.json with missing unique forms.')
