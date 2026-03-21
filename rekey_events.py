import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('f:/Pokemath/pokemon_info.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# (dex, old_numeric_key) -> event_type
# H=Halloween/Fall/Autumn/DotD  C=Christmas/Winter  U=Unique  E=Easter/Spring  S=Summer
assignments = {
    ('13','1'):'S',   # Bug Catcher Weedle - summer bug-catching
    ('16','1'):'H',   # Papel Picado Pidgey - Day of the Dead
    # Pikachu GO costume variants - Unique
    ('25','1'):'U', ('25','2'):'U', ('25','3'):'U', ('25','4'):'U', ('25','5'):'U',
    ('25','7'):'U', ('25','8'):'U', ('25','9'):'U', ('25','10'):'U',
    ('25','11'):'U', ('25','12'):'U', ('25','16'):'U',
    ('25','17'):'S',  # Surf Pikachu - Summer
    ('29','1'):'U',   # Valentine's Nidoran - Unique
    ('37','2'):'U',   # Birthday Cake Alopix - Unique (Anniversary)
    ('43','1'):'E',   # Sprouting Oddish - Easter/Spring
    ('46','1'):'E',   # Flower Paras - Spring
    ('52','4'):'E',   # Egg Painter Meowth - Easter
    ('82','1'):'E',   # Eggneton - Easter
    ('83','2'):'S',   # Umbrella Farfetch'd - Summer rain
    ('88','2'):'U',   # Cube Slime Grimer - Unique
    ('103','2'):'U',  # Celebrating Alolan Exeggutor ft. Komala - Unique (Anniversary)
    ('114','1'):'U',  # Pasta Bolognese Tangela - Unique
    ('115','2'):'E',  # Egg Hunter Kangaskhan - Easter
    ('131','2'):'U',  # Anniversary Lapras - Unique
    ('131','3'):'E',  # Egg Nest Lapras - Easter
    ('132','1'):'E',  # Cracked Ditto - Easter
    ('143','2'):'S',  # Grilling Snorlax - Summer BBQ
    ('143','3'):'C',  # Santa Snorlax - Christmas
    ('146','2'):'S',  # Olympic Flame Moltres - Summer Olympics
    ('147','1'):'U',  # Martini Dratini - Unique (New Year)
    ('149','1'):'U',  # Guardian Dragonite - Unique
    ('151','1'):'U',  # Pride Mew - Unique (Pride)
    ('154','1'):'U',  # Shamrock Meganium - Unique (St. Patrick's)
    ('158','1'):'S',  # Sharkfin Totodile - Summer
    ('161','1'):'S',  # Archery Sentret - Summer Olympics
    ('166','1'):'H',  # Harvesting Ledian - Autumn/Halloween harvest
    ('172','2'):'S',  # Ukulele Pichu - Summer
    ('181','2'):'U',  # Pride Ampharos - Unique
    ('182','1'):'U',  # Pride Bellossom - Unique
    ('182','2'):'U',  # Music Box Bellossom - Unique
    ('192','1'):'U',  # Anniversary Sunflora - Unique
    ('194','2'):'S',  # Skater Wooper - Summer
    ('195','1'):'S',  # Camp Leader Quagsire - Summer camp
    ('201','28'):'U', # Pride Unown - Unique
    ('235','1'):'S',  # Fishing Smeargle - Summer fishing
    ('256','1'):'U',  # Chicombusken - Unique (Cinco de Mayo)
    ('258','1'):'U',  # Moon Fairy Mudkip - Unique (Lunar)
    ('262','1'):'H',  # Evil Mightyena - Halloween
    ('263','2'):'U',  # Pride Zigzagoon - Unique
    ('267','1'):'E',  # Hatching Beautifly - Easter/Spring
    ('270','1'):'U',  # Sombrero Lotad - Unique (Cinco de Mayo)
    ('274','1'):'E',  # Bird Nest Nuzleaf - Easter/Spring
    ('282','2'):'U',  # Pride Gardevoir & Delphox - Unique
    ('284','1'):'U',  # Pride Masquerain - Unique
    ('286','1'):'U',  # Sage of Foliage - Unique
    ('298','1'):'E',  # Easter Egg Azurill - Easter
    ('303','2'):'E',  # Overgrown Mawile - Spring
    ('316','1'):'U',  # Temaki Gulpin - Unique
    ('317','1'):'H',  # Pile of Leaves Swalot - Halloween/Autumn
    ('327','1'):'H',  # Voodoo Spinda - Halloween
    ('338','1'):'U',  # Soluna - Unique
    ('350','1'):'U',  # Pride Milotic - Unique
    ('354','2'):'H',  # Banshee Banette - Halloween
    ('355','1'):'H',  # Sugar Duskull - Day of the Dead
    ('361','1'):'S',  # Tent Snorunt - Summer camping
    ('363','1'):'S',  # Ice Cream Spheals - Summer
    ('366','1'):'U',  # Clamacaron - Unique
    ('387','1'):'U',  # Treasure Turtwig - Unique
    ('393','1'):'S',  # Floatie Piplup - Summer
    ('393','2'):'U',  # Pride Piplup - Unique
    ('399','1'):'E',  # Easter Bidoof - Easter
    ('402','1'):'U',  # Wizard Kricketune - Unique
    ('407','1'):'U',  # Pride Roserade - Unique
    ('419','1'):'S',  # Ranger Floatzel - Summer
    ('421','2'):'E',  # Blossom Cherrim - Easter/Spring
    ('426','1'):'U',  # Drifboy - Unique
    ('427','1'):'E',  # Egg Basket Buneary - Easter
    ('428','2'):'U',  # Doll Lopunny - Unique
    ('454','1'):'U',  # Rogue Toxicroak - Unique
    ('455','1'):'H',  # Overgrown Carnivine - Halloween
    ('461','1'):'H',  # Sage of Shadows - Halloween
    ('471','1'):'C',  # Snowglobe Glaceon - Christmas
    ('474','1'):'U',  # Porygon-X - Unique
    ('491','1'):'U',  # Error Darkrai - Unique
    ('492','2'):'E',  # Bouquet Shaymin - Easter/Spring
    ('493','18'):'U', # Pride Arceus - Unique
    ('493','19'):'U', # Glitched Beta Arceus - Unique
    ('497','1'):'U',  # Wooden Serperior - Unique
    ('509','1'):'U',  # Bard Purrloin - Unique
    ('524','1'):'U',  # Sage of Snaring - Unique
    ('528','1'):'U',  # Cloubat - Unique
    ('531','2'):'C',  # Elf Audino - Christmas
    ('532','1'):'U',  # Timber Timburr - Unique
    ('542','1'):'H',  # Leavanette - Halloween (autumn leaves)
    ('546','1'):'E',  # Cherry Blossom Cottonee - Easter/Spring
    ('549','2'):'H',  # La Catrina Hisuian Lilligant - Day of the Dead
    ('562','2'):'H',  # Honoring Yamask - Day of the Dead
    ('575','1'):'H',  # Pumpkin Gothorita - Halloween
    ('576','1'):'H',  # Monarch Gothitelle - Day of the Dead
    ('580','1'):'S',  # Waterpolo Ducklett - Summer
    ('580','2'):'E',  # Baby Ducklett - Easter/Spring
    ('581','1'):'E',  # Flower Family Swanna - Easter/Spring
    ('590','1'):'U',  # Foombrella - Unique
    ('608','1'):'U',  # Paper Lantern Lampent - Unique (Lunar New Year)
    ('613','1'):'E',  # Spring Fever Cubchoo - Easter/Spring
    ('623','1'):'U',  # Ruined Golurk - Unique
    ('623','2'):'U',  # Hero Golurk - Unique
    ('626','1'):'U',  # Minotaur Bouffalant - Unique
    ('627','1'):'U',  # Pride Rufflet - Unique
    ('650','1'):'U',  # Cooking Chespin - Unique
    ('654','1'):'U',  # Sage of Flames - Unique
    ('656','1'):'E',  # Toadsie (Froakie) - Easter/Spring (frog)
    ('658','2'):'U',  # Ash's Greninja - Unique
    ('659','1'):'E',  # Nibbling Bunnelby - Easter
    ('660','1'):'E',  # Bonnersby - Easter
    ('667','1'):'U',  # Lion Dancer Litleo - Unique (Lunar New Year)
    ('668','1'):'H',  # Alebrije Pyroar - Day of the Dead
    ('669','5'):'E',  # Flower Fairy Flabébé - Easter/Spring
    ('670','6'):'E',  # Eternal Flower Floette - Easter/Spring
    ('674','1'):'U',  # Pacifier Pancham - Unique
    ('679','1'):'H',  # Cursed Blade Honedge - Halloween
    ('680','1'):'U',  # Fancy Cutlery Doublade - Unique
    ('700','1'):'U',  # Pride Sylveon - Unique
    ('700','2'):'U',  # Sylvirus - Unique
    ('704','1'):'U',  # Goomy Brûlée - Unique
    ('704','2'):'U',  # Muddy Goomy - Unique
    ('707','1'):'U',  # Baby Toy Klefki - Unique
    ('710','1'):'H',  # Pumpkaboo small - Halloween
    ('710','2'):'H',  # Pumpkaboo large - Halloween
    ('710','3'):'H',  # Pumpkaboo supersize - Halloween
    ('710','4'):'H',  # Pumpkaboo Spice Latte - Halloween
    ('711','1'):'H',  # Gourgeist small - Halloween
    ('711','2'):'H',  # Gourgeist large - Halloween
    ('711','3'):'H',  # Gourgeist supersize - Halloween
    ('719','2'):'E',  # Spring Blooming Diancie - Easter/Spring
    ('724','2'):'U',  # Cupid Decidueye - Unique (Valentine's)
    ('733','1'):'U',  # Pride Toucannon - Unique
    ('737','1'):'S',  # Camper Charjabug - Summer
    ('741','4'):'S',  # Cheerleader Oricorio - Summer
    ('755','1'):'H',  # Halloween Morelull - Halloween
    ('756','1'):'H',  # Overgrown Shiinotic - Halloween
    ('757','1'):'U',  # Fire Fairy Salandit - Unique
    ('760','1'):'U',  # Fazwear - Unique
    ('762','1'):'E',  # Egg Searching Steenee - Easter
    ('764','1'):'U',  # Pride Comfey - Unique
    ('774','15'):'U', # Rainbow Minior - Unique (Pride/Rainbow)
    ('777','2'):'E',  # Easter Togedemaru - Easter
    ('778','1'):'U',  # Mimikyu totem - Unique
    ('779','1'):'U',  # Pride Queen Bruxish - Unique
    ('795','1'):'E',  # Flower Pheromosa - Easter/Spring
    ('806','1'):'U',  # Corrupted Blacephalon - Unique
    ('814','1'):'S',  # Relay Race Raboot - Summer Olympics
    ('818','2'):'S',  # Fencinteleon - Summer Olympics
    ('819','1'):'H',  # Painted Acorn Skwovet - Halloween/Autumn
    ('831','1'):'U',  # Anniversary Wooloo - Unique
    ('840','1'):'S',  # Strawberry Shortcake Applin - Summer
    ('841','2'):'H',  # Pear Flapple - Halloween/Autumn harvest
    ('848','1'):'U',  # Boxel - Unique
    ('854','1'):'U',  # Good Luck Sinistea - Unique (Lunar New Year)
    ('855','1'):'U',  # Kettle Polteageist - Unique
    ('861','2'):'C',  # Grinchsnarl - Christmas
    ('870','1'):'U',  # Dango Falinks - Unique
    ('893','2'):'U',  # Druid Zarude - Unique
    ('901','2'):'H',  # Barbarian Bloodmoon Ursaluna - Halloween
    ('910','1'):'U',  # Proud Crocalor - Unique
    ('915','1'):'E',  # Egg Forager Lechonk - Easter
    ('924','1'):'U',  # Pride Tandemaus - Unique
    ('925','2'):'U',  # Marshmallow Maushold - Unique
    ('926','1'):'U',  # Hearts Fidough - Unique (Valentine's)
    ('927','1'):'H',  # Autumn Dachsbun - Halloween/Autumn
    ('932','1'):'H',  # Mushroom Nacli - Halloween/Autumn
    ('939','1'):'U',  # Onigiri Bellibolt - Unique
    ('945','1'):'S',  # Raincoat Grafaiai - Summer
    ('959','1'):'U',  # Pride Tinkaton - Unique
    ('960','1'):'C',  # Candy Cane Wiglett - Christmas
    ('962','1'):'U',  # Love Bombirdier - Unique (Valentine's)
    ('999','2'):'C',  # Gingerbread Gimmighoul - Christmas
    ('1004','1'):'U', # Gradient Chi-Yu - Unique
}

print(f'Total assignments defined: {len(assignments)}')

# Process assignments: build mapping from old keys to new event keys
# Track next available number per (dex, event_type)
next_num = {}  # (dex, etype) -> next number to assign

def get_next_key(dex, etype):
    k = (dex, etype)
    if k not in next_num:
        # Find max existing number for this event type in this dex
        existing = [key for key in data.get(dex, {}) if re.match(f'^{etype}(\\d+)$', key)]
        max_n = max([int(re.match(f'^{etype}(\\d+)$', key).group(1)) for key in existing], default=0) if existing else 0
        next_num[k] = max_n + 1
    result = f'{etype}{next_num[k]}'
    next_num[k] += 1
    return result

# Apply re-keying
changes = []
for (dex, old_key), etype in assignments.items():
    if dex not in data or old_key not in data[dex]:
        print(f'WARNING: dex={dex} key={old_key} not found in data')
        continue
    new_key = get_next_key(dex, etype)
    entry = data[dex][old_key].copy()
    # Update slug to match new key convention
    entry['slug'] = f'{dex}-{new_key}'
    # Add the new key
    data[dex][new_key] = entry
    # Remove the old key
    del data[dex][old_key]
    name = entry.get('name', '?')
    changes.append((dex, old_key, new_key, etype, name))
    print(f'  dex={dex:5} {old_key:3} -> {new_key:4}  ({name})')

print(f'\nTotal changes: {len(changes)}')

# Re-order each dex: numeric keys sorted, then event keys (H, C, U, E, S order)
def sort_key(k):
    if re.match(r'^\d+$', k):
        return (0, int(k), '')
    m = re.match(r'^([HCUES])(\d+)$', k)
    if m:
        order = {'H':1,'C':2,'U':3,'E':4,'S':5}
        return (1, order.get(m.group(1), 9), int(m.group(2)))
    return (2, 0, k)

for dex in data:
    sorted_variants = dict(sorted(data[dex].items(), key=lambda x: sort_key(x[0])))
    data[dex] = sorted_variants

with open('f:/Pokemath/pokemon_info.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('\nDone. pokemon_info.json updated.')

# Summary by event type
from collections import Counter
by_type = Counter(etype for _, _, _, etype, _ in changes)
print('Changes by type:', dict(by_type))
