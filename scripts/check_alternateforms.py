import json, re, pathlib

base = pathlib.Path(__file__).resolve().parent.parent
js_path = base / 'alternateforms.js'
json_path = base / 'pokemon_info.json'

with open(json_path, 'r', encoding='utf-8') as f:
    p_info = json.load(f)

# Build mappings by name (casefold) and by imageid for easier matching
name_map = {}
imageid_map = {}
for pid, forms in p_info.items():
    for fid, entry in forms.items():
        name = entry.get('name')
        imageid = entry.get('imageid')
        if name:
            name_map[name.casefold()] = (pid, fid, entry)
        if imageid is not None:
            imageid_map[int(imageid)] = (pid, fid, entry)

text = js_path.read_text(encoding='utf-8')

def extract_js_object(src: str, varname: str) -> str:
    """Extract the JS object literal assigned to a var (including braces)."""
    marker = f"var {varname}"
    idx = src.find(marker)
    if idx == -1:
        raise ValueError(f'Could not find variable {varname}')
    idx = src.find('=', idx)
    if idx == -1:
        raise ValueError(f'Could not find assignment for {varname}')
    idx = src.find('{', idx)
    if idx == -1:
        raise ValueError(f'Could not find object start for {varname}')

    depth = 0
    end = idx
    while end < len(src):
        ch = src[end]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return src[idx : end + 1]
        end += 1
    raise ValueError(f'Could not find matching closing brace for {varname}')

alt_text = extract_js_object(text, 'alternateFormsData')
evt_text = extract_js_object(text, 'eventData')

# Parse alternateFormsData
alt_forms = []  # (base_id, form_id, name)
base_id = None
form_id = None
for line in alt_text.splitlines():
    line = line.strip()
    m = re.match(r'"(\d+)"\s*:\s*\{', line)
    if m:
        if base_id is None:
            base_id = m.group(1)
            form_id = None
        else:
            # when base_id already set, this is likely form_id (nested)
            form_id = m.group(1)
        continue
    if base_id is not None and form_id is not None:
        m = re.match(r'"name"\s*:\s*"([^"]+)"', line)
        if m:
            name = m.group(1)
            alt_forms.append((base_id, form_id, name))

# Parse eventData entries by regex for any object block with id + name
pattern = re.compile(r'\{([^}]*?"id"\s*:\s*\d+[^}]*?"name"\s*:\s*"[^"]+"[^}]*?)\}', re.S)
evt_forms = []  # (id, name)
for m in pattern.finditer(evt_text):
    blk = m.group(1)
    id_m = re.search(r'"id"\s*:\s*(\d+)', blk)
    name_m = re.search(r'"name"\s*:\s*"([^"]+)"', blk)
    if id_m and name_m:
        ev_id = id_m.group(1)
        name = name_m.group(1)
        evt_forms.append((ev_id, name))

missing = []
for base_id, form_id, name, imageid, types in alt_forms:
    if imageid is None:
        missing.append(('form', base_id, form_id, name, 'no imageid'))
    elif int(imageid) not in imageid_map:
        missing.append(('form', base_id, form_id, name, int(imageid)))

for ev_id, special, name, imageid, types in evt_forms:
    if imageid is None:
        missing.append(('event', ev_id, special, name, 'no imageid'))
    elif int(imageid) not in imageid_map:
        missing.append(('event', ev_id, special, name, int(imageid)))

print('total forms in alternateforms.js:', len(alt_forms))
print('total event forms in alternateforms.js:', len(evt_forms))
print('missing count:', len(missing))
for item in missing[:50]:
    print(item)

# list missing names
missing_names = [it[-1] for it in missing]

# also list any names in json that are not used in alternateforms (not required)

with open(base / 'missing_forms_report.txt', 'w', encoding='utf-8') as f:
    f.write('Missing entries for pokemon_info.json\n')
    for item in missing:
        f.write(str(item) + '\n')

print('Report written to missing_forms_report.txt')
