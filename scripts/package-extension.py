"""Create deterministic icon assets and browser ZIPs using only the standard library."""
from pathlib import Path
import json, math, struct, zlib, zipfile, hashlib
ROOT=Path(__file__).resolve().parents[1]
EXT=ROOT/'extension'
ASSETS=ROOT/'dist'/'assets'; ASSETS.mkdir(exist_ok=True)
DOWNLOADS=ROOT/'dist'/'downloads'; DOWNLOADS.mkdir(exist_ok=True)
ICONS=EXT/'icons'; ICONS.mkdir(exist_ok=True)
SVG='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="1" y="1" width="126" height="126" rx="30" fill="#182c29"/><circle cx="61" cy="62" r="36" fill="none" stroke="#dbf294" stroke-width="8"/><path d="M61 39v25l15 9" fill="none" stroke="#dbf294" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="94" cy="94" r="23" fill="#245c4b" stroke="#182c29" stroke-width="5"/><path d="m83 94 8 8 15-17" fill="none" stroke="#dbf294" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'''
(ASSETS/'tasktime.svg').write_text(SVG,encoding='utf-8')
(EXT/'icons'/'tasktime.svg').write_text(SVG,encoding='utf-8')
def distance(x,y,a,b,c,d):
    dx,dy=c-a,d-b;t=max(0,min(1,((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy)))
    return math.hypot(x-(a+t*dx),y-(b+t*dy))
def color(x,y,accent):
    ink=(24,44,41,255);lime=accent;green=(36,92,75,255)
    if not(1<=x<=127 and 1<=y<=127):return (0,0,0,0)
    if math.hypot(max(31-x,0,x-97),max(31-y,0,y-97))>30:return (0,0,0,0)
    out=ink
    if abs(math.hypot(x-61,y-62)-36)<4:out=lime
    if min(distance(x,y,61,39,61,64),distance(x,y,61,64,76,73))<4:out=lime
    radius=math.hypot(x-94,y-94)
    if radius<25.5:out=ink
    if radius<20.5:out=green
    if min(distance(x,y,83,94,91,102),distance(x,y,91,102,106,85))<3.5:out=lime
    return out
def png(size,accent=(219,242,148,255)):
    scale=4;rows=[]
    for j in range(size):
        row=bytearray([0])
        for i in range(size):
            samples=[color((i+(sx+.5)/scale)*128/size,(j+(sy+.5)/scale)*128/size,accent) for sy in range(scale) for sx in range(scale)]
            row.extend(round(sum(c[k] for c in samples)/len(samples)) for k in range(4))
        rows.append(bytes(row))
    def chunk(tag,data):return struct.pack('!I',len(data))+tag+data+struct.pack('!I',zlib.crc32(tag+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
for size in [16,32,48,128]: (ICONS/f'icon{size}.png').write_bytes(png(size))
for name,accent in [('red',(255,115,120,255)),('orange',(255,174,82,255)),('green',(219,242,148,255))]:
    for size in [16,32]: (ICONS/f'{name}{size}.png').write_bytes(png(size,accent))
(ASSETS/'tasktime-128.png').write_bytes((ICONS/'icon128.png').read_bytes())
(ASSETS/'chrome.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#fff"/><path d="M32 2a30 30 0 0 1 26 15H32a15 15 0 0 0-13 22L6 17A30 30 0 0 1 32 2" fill="#ea4335"/><path d="M58 17a30 30 0 0 1-26 45l13-23a15 15 0 0 0-13-22" fill="#fbbc05"/><path d="M32 62A30 30 0 0 1 6 17l13 22a15 15 0 0 0 26 0" fill="#34a853"/><circle cx="32" cy="32" r="14" fill="#4285f4" stroke="white" stroke-width="3"/></svg>''',encoding='utf-8')
(ASSETS/'opera.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="o" x2="0" y2="1"><stop stop-color="#ff344e"/><stop offset="1" stop-color="#bd0038"/></linearGradient></defs><path d="M32 2C14 2 3 15 3 32s11 30 29 30 29-13 29-30S50 2 32 2m0 9c9 0 15 9 15 21s-6 21-15 21-15-9-15-21 6-21 15-21" fill="url(#o)" fill-rule="evenodd"/></svg>''',encoding='utf-8')
readme='''TaskTime 0.1.27 — BETA / ТЕСТОВА ВЕРСИЯ

БЪЛГАРСКИ
1. Разархивирай ZIP в постоянна папка.
2. Отвори {url} в {browser}.
3. Включи Developer mode / Режим за програмисти.
4. Избери Load unpacked / Зареждане на разопаковано разширение.
5. Избери папката с manifest.json (не ZIP файла).
6. Презареди Redstone и Ximble. Дръж двата сайта в същия профил.
7. Закачи иконката TaskTime. Клик върху нея отваря отчета.

Това не е добавка от официален магазин. Не е валидирана в реалните служебни сайтове.
Първо сравни пробни записи. Не използвай като официален отчет.
Следи лига+тип+ID и бутоните Finish/Clear Samples & Next/Exit. Задача без такъв бутон остава за ръчен преглед.
Звуков сигнал и цветна иконка на таба при нова задача и при „Are you still active?“ (настройки в отчета).
Clock In/Out: разпознава единствен видим активен бутон с точното английско име.
Началото на вече започнала смяна се записва от първото наблюдение, не се възстановява.
Ненаблюдавани периоди над 45 секунди се маркират. Статистиката включва само потвърдени/ръчно приети записи.
Не следи други браузъри/профили; не се синхронизира. Дръж Ximble отворен.
При премахване на добавката локалните данни се губят. Изнасяй JSON архив редовно.
Обновяване: замени файловете в същата папка и натисни Reload. Не премахвай старата инсталация.
JSON възстановяване, XLSX, норми за време и пълен разчет на чакане/зареждане предстоят.

ENGLISH
1. Extract the ZIP to a permanent folder.
2. Open {url} in {browser}.
3. Enable Developer mode, choose Load unpacked and select the folder containing manifest.json.
4. Reload Redstone and Ximble in the same browser profile. Keep Ximble open.
5. Pin TaskTime; clicking its icon opens the report.

Not a store release. Live work-site detection has not been validated. Compare trial records first.
Uses task type+ID, Finish and transition to a new ID. Finish & Exit requires manual review.
Clock detection requires a single visible enabled button with the exact English name.
Already-started shifts begin at first observation; earlier times are not reconstructed.
Gaps over 45 seconds are flagged. Only confirmed/manually accepted tasks enter statistics.
No cross-browser/profile sync. Export JSON backups before removal or updates.
Update in the same folder and Reload the existing extension to preserve local data.
JSON restore, XLSX, time targets and full waiting/loading accounting are not implemented yet.

PRIVACY / ПОВЕРИТЕЛНОСТ
All work data stays in chrome.storage.local. No server, analytics, credentials, screenshots or task content collected.
Access is limited to https://redstone.secondspectrum.com/* and https://app.ximble.com/*.
Permissions: storage (local records), alarms (shift questions). No automatic clicking or form submission.
Browser names/icons identify compatibility only; no affiliation or endorsement.
'''
import re
bg=(EXT/'background.js').read_text(encoding='utf-8');ver=json.loads((EXT/'manifest.json').read_text(encoding='utf-8'))['version']
(EXT/'background.js').write_text(re.sub(r"const BUILD='[^']*'",f"const BUILD='{ver}'",bg,count=1),encoding='utf-8')
app=ROOT/'dist'/'app.js'
if app.exists():app.write_text(re.sub(r"const VERSION='[^']*'",f"const VERSION='{ver}'",app.read_text(encoding='utf-8'),count=1),encoding='utf-8')
meta=[]
for browser,url in [('Chrome','chrome://extensions'),('Opera','opera://extensions')]:
    target=DOWNLOADS/f'tasktime-{browser.lower()}-0.1.27.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(EXT.rglob('*')):
            if file.is_file(): archive.write(file,file.relative_to(EXT).as_posix())
        archive.writestr('INSTALL.txt',readme.format(browser=browser,url=url))
    meta.append({'browser':browser,'file':target.name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(ROOT/'dist'/'version.json').write_text(json.dumps({'version':json.loads((EXT/'manifest.json').read_text(encoding='utf-8'))['version']}),encoding='utf-8')
(DOWNLOADS/'checksums.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
print(json.dumps(meta,indent=2))
