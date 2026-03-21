import json
import re
import pathlib

base = pathlib.Path(__file__).resolve().parent.parent
js_path = base / 'alternateforms.js'
json_path = base / 'pokemon_info.json'

with open(json_path, 'r', encoding='utf-8') as f:
    p_info = json.load(f)

# build mapping from image id to (pid, fid, entry)
imageid_map = {}
for pid, forms in p_info.items():
    for fid, entry in forms.items():
        imageid = entry.get('imageid')
        if imageid is not None:
            imageid_map[int(imageid)] = (pid, fid, entry)

text = js_path.read_text(encoding='utf-8')

# extract object literals from JS file

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

# sanitize to valid JSON (remove trailing commas)
def js_to_json(js_text: str) -> str:
    return re.sub(r',\s*([}\]])', r'\1', js_text)

alt_obj = json.loads(js_to_json(alt_text))
evt_obj = json.loads(js_to_json(evt_text))

# collect all forms from alternateFormsData
alt_forms = []  # (base_id, form_id, name, imageid, types)
for base_id, forms in alt_obj.items():
    for form_id, entry in forms.items():
        alt_forms.append((base_id, form_id, entry.get('name'), entry.get('imageid'), entry.get('types')))

# collect all forms from eventData
evt_forms = []  # (id, specialId, name, imageid, types, event)
for event_key, bases in evt_obj.items():
    for base_id, forms in bases.items():
        for form_id, entry in forms.items():
            evt_forms.append((entry.get('id'), entry.get('specialId'), entry.get('name'), entry.get('imageid'), entry.get('types'), event_key))

missing = []
for base_id, form_id, name, imageid, types in alt_forms:
    if imageid is None:
        missing.append(('form', base_id, form_id, name, 'no imageid'))
    elif int(imageid) not in imageid_map:
        missing.append(('form', base_id, form_id, name, int(imageid)))

for ev_id, special, name, imageid, types, event_key in evt_forms:
    if imageid is None:
        missing.append(('event', event_key, ev_id, special, name, 'no imageid'))
    elif int(imageid) not in imageid_map:
        missing.append(('event', event_key, ev_id, special, name, int(imageid)))

print('total forms in alternateforms.js:', len(alt_forms))
print('total event forms in alternateforms.js:', len(evt_forms))
print('missing count:', len(missing))
for item in missing[:80]:
    print(item)

with open(base / 'missing_forms_report.txt', 'w', encoding='utf-8') as f:
    f.write('Missing entries for pokemon_info.json\n')
    for item in missing:
        f.write(str(item) + '\n')

print('Report written to missing_forms_report.txt')
