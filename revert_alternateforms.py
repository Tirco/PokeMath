import re, json, sys
sys.stdout.reconfigure(encoding='utf-8')

# Parse alternateforms.js - strip JS wrapper to get JSON
with open('f:/Pokemath/alternateforms.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract only the alternateFormsData block
match = re.search(r'var\s+alternateFormsData\s*=\s*(\{)', content)
start = match.start(1)
depth = 0
end = start
for i, ch in enumerate(content[start:], start):
    if ch == '{': depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end = i + 1
            break
block = content[start:end]
# Fix trailing commas
block = re.sub(r',(\s*[}\]])', r'\1', block)
af_data = json.loads(block)

# Build set of imageids that exist in alternateforms as numeric-keyed variants
af_imageid_set = set()
for dex, variants in af_data.items():
    for varkey, vdata in variants.items():
        if re.match(r'^\d+$', varkey):
            imgid = vdata.get('imageid')
            if imgid is not None:
                af_imageid_set.add(int(imgid))

print(f'Imageids in alternateforms (numeric variants): {len(af_imageid_set)}')

# Load pokemon_info.json
with open('f:/Pokemath/pokemon_info.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# The assignments from rekey_events.py - same dict
# We need: (dex, original_old_key) -> (new_event_key, event_type)
# Reconstruct from the previous script's logic
# Instead, let's just find all event-keyed variants whose imageid is in alternateforms
# and whose imageid is NOT in the 50xxx/130xxx custom range

reverts = []  # (dex, current_event_key, original_numeric_key, imageid, name)

# The original assignments dict (copied from rekey_events.py)
assignments = {
    ('13','1'):'S', ('16','1'):'H',
    ('25','1'):'U', ('25','2'):'U', ('25','3'):'U', ('25','4'):'U', ('25','5'):'U',
    ('25','7'):'U', ('25','8'):'U', ('25','9'):'U', ('25','10'):'U',
    ('25','11'):'U', ('25','12'):'U', ('25','16'):'U', ('25','17'):'S',
    ('29','1'):'U', ('37','2'):'U', ('43','1'):'E', ('46','1'):'E',
    ('52','4'):'E', ('82','1'):'E', ('83','2'):'S', ('88','2'):'U',
    ('103','2'):'U', ('114','1'):'U', ('115','2'):'E', ('131','2'):'U',
    ('131','3'):'E', ('132','1'):'E', ('143','2'):'S', ('143','3'):'C',
    ('146','2'):'S', ('147','1'):'U', ('149','1'):'U', ('151','1'):'U',
    ('154','1'):'U', ('158','1'):'S', ('161','1'):'S', ('166','1'):'H',
    ('172','2'):'S', ('181','2'):'U', ('182','1'):'U', ('182','2'):'U',
    ('192','1'):'U', ('194','2'):'S', ('195','1'):'S', ('201','28'):'U',
    ('235','1'):'S', ('256','1'):'U', ('258','1'):'U', ('262','1'):'H',
    ('263','2'):'U', ('267','1'):'E', ('270','1'):'U', ('274','1'):'E',
    ('282','2'):'U', ('284','1'):'U', ('286','1'):'U', ('298','1'):'E',
    ('303','2'):'E', ('316','1'):'U', ('317','1'):'H', ('327','1'):'H',
    ('338','1'):'U', ('350','1'):'U', ('354','2'):'H', ('355','1'):'H',
    ('361','1'):'S', ('363','1'):'S', ('366','1'):'U', ('387','1'):'U',
    ('393','1'):'S', ('393','2'):'U', ('399','1'):'E', ('402','1'):'U',
    ('407','1'):'U', ('419','1'):'S', ('421','2'):'E', ('426','1'):'U',
    ('427','1'):'E', ('428','2'):'U', ('454','1'):'U', ('455','1'):'H',
    ('461','1'):'H', ('471','1'):'C', ('474','1'):'U', ('491','1'):'U',
    ('492','2'):'E', ('493','18'):'U', ('493','19'):'U', ('497','1'):'U',
    ('509','1'):'U', ('524','1'):'U', ('528','1'):'U', ('531','2'):'C',
    ('532','1'):'U', ('542','1'):'H', ('546','1'):'E', ('549','2'):'H',
    ('562','2'):'H', ('575','1'):'H', ('576','1'):'H', ('580','1'):'S',
    ('580','2'):'E', ('581','1'):'E', ('590','1'):'U', ('608','1'):'U',
    ('613','1'):'E', ('623','1'):'U', ('623','2'):'U', ('626','1'):'U',
    ('627','1'):'U', ('650','1'):'U', ('654','1'):'U', ('656','1'):'E',
    ('658','2'):'U', ('659','1'):'E', ('660','1'):'E', ('667','1'):'U',
    ('668','1'):'H', ('669','5'):'E', ('670','6'):'E', ('674','1'):'U',
    ('679','1'):'H', ('680','1'):'U', ('700','1'):'U', ('700','2'):'U',
    ('704','1'):'U', ('704','2'):'U', ('707','1'):'U',
    ('710','1'):'H', ('710','2'):'H', ('710','3'):'H', ('710','4'):'H',
    ('711','1'):'H', ('711','2'):'H', ('711','3'):'H',
    ('719','2'):'E', ('724','2'):'U', ('733','1'):'U', ('737','1'):'S',
    ('741','4'):'S', ('755','1'):'H', ('756','1'):'H', ('757','1'):'U',
    ('760','1'):'U', ('762','1'):'E', ('764','1'):'U', ('774','15'):'U',
    ('777','2'):'E', ('778','1'):'U', ('779','1'):'U', ('795','1'):'E',
    ('806','1'):'U', ('814','1'):'S', ('818','2'):'S', ('819','1'):'H',
    ('831','1'):'U', ('840','1'):'S', ('841','2'):'H', ('848','1'):'U',
    ('854','1'):'U', ('855','1'):'U', ('861','2'):'C', ('870','1'):'U',
    ('893','2'):'U', ('901','2'):'H', ('910','1'):'U', ('915','1'):'E',
    ('924','1'):'U', ('925','2'):'U', ('926','1'):'U', ('927','1'):'H',
    ('932','1'):'H', ('939','1'):'U', ('945','1'):'S', ('959','1'):'U',
    ('960','1'):'C', ('962','1'):'U', ('999','2'):'C', ('1004','1'):'U',
}

# For each assignment, find the current event key in data and check imageid
# We need to find what the entry was re-keyed to. Since we re-keyed in order,
# we need to find the current event-keyed entry that matches the original imageid.

# Build reverse lookup: for each dex, find all event-keyed variants and their imageid
to_revert = []  # (dex, current_event_key, original_old_key)

# For each original assignment, find the current entry by scanning for matching imageid
# Build a map of (dex, original_old_key) to what it was renamed to
# We can do this by finding event-keyed entries whose imageid matches what was in alternateforms

for dex_str, variants in data.items():
    for key, entry in list(variants.items()):
        # Only look at event-keyed variants (H/C/U/E/S + number)
        m = re.match(r'^([HCUES])(\d+)$', key)
        if not m:
            continue
        imgid = entry.get('imageid')
        if imgid is None:
            continue
        imgid = int(imgid)
        # Check if this imageid was in alternateforms as a numeric variant
        if imgid in af_imageid_set:
            # Find the original numeric key from assignments
            # Look through assignments for this dex
            original_key = None
            for (d, ok), et in assignments.items():
                if d == dex_str:
                    # Check if the entry at data[d][ok] after re-keying became this key
                    # We need to match by imageid since the old key is gone
                    # The old entry would have had the same imageid
                    pass
            to_revert.append((dex_str, key, imgid, entry.get('name', '?')))

print(f'\nEntries to revert (imageid in alternateforms): {len(to_revert)}')
for dex, key, imgid, name in to_revert:
    print(f'  dex={dex:5} {key:4} imageid={imgid:>7} name={name}')

# Now do the actual revert: restore original numeric keys
# We need the original numeric key for each entry
# Match: assignments[(dex, orig_key)] -> event_type, and the entry's imageid matches alternateforms

# Build: imageid -> original numeric key (from alternateforms data)
af_imageid_to_origkey = {}  # imageid -> original varkey in alternateforms
for dex, variants in af_data.items():
    for varkey, vdata in variants.items():
        if re.match(r'^\d+$', varkey):
            imgid = vdata.get('imageid')
            if imgid is not None:
                af_imageid_to_origkey[int(imgid)] = (dex, varkey)

reverted = 0
skipped = 0
for dex_str, variants in data.items():
    keys_to_process = list(variants.keys())
    for key in keys_to_process:
        if not re.match(r'^[HCUES]\d+$', key):
            continue
        entry = variants.get(key)
        if entry is None:
            continue
        imgid = entry.get('imageid')
        if imgid is None:
            continue
        imgid = int(imgid)
        if imgid not in af_imageid_set:
            continue
        # This entry was originally a numbered variant in alternateforms
        # Find its original numeric key
        orig_dex, orig_key = af_imageid_to_origkey[imgid]
        if orig_dex != dex_str:
            print(f'  WARNING: dex mismatch for imageid {imgid}: af says dex={orig_dex}, data says dex={dex_str}')
            skipped += 1
            continue
        # Check if the original numeric key is already taken
        if orig_key in variants and orig_key != key:
            print(f'  CONFLICT: dex={dex_str} key={key} ({entry.get("name")}) -> {orig_key} already exists')
            skipped += 1
            continue
        # Restore: add with original numeric key, remove event key
        restored_entry = entry.copy()
        restored_entry['slug'] = entry['slug']  # slug stays as-is (already set during rekey)
        data[dex_str][orig_key] = restored_entry
        del data[dex_str][key]
        print(f'  dex={dex_str:5} {key:4} -> {orig_key:3}  ({entry.get("name","?")})')
        reverted += 1

print(f'\nReverted: {reverted}, Skipped: {skipped}')

# Re-sort keys: numeric first, then H/C/U/E/S
def sort_key(k):
    if re.match(r'^\d+$', k):
        return (0, int(k), '')
    m = re.match(r'^([HCUES])(\d+)$', k)
    if m:
        order = {'H':1,'C':2,'U':3,'E':4,'S':5}
        return (1, order.get(m.group(1), 9), int(m.group(2)))
    return (2, 0, k)

for dex in data:
    data[dex] = dict(sorted(data[dex].items(), key=lambda x: sort_key(x[0])))

with open('f:/Pokemath/pokemon_info.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('\nDone. pokemon_info.json updated.')
