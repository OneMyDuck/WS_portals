"""Build a self-contained playable without third-party dependencies."""
import base64
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'assets-manifest.js').read_text().removeprefix('const SEQUENCES = ').strip().removesuffix(';'))
paths = [ROOT / p for frames in manifest.values() for p in frames]
paths += [ROOT / 'assets/scene1' / name for name in ['scene1_back.png', 'port1_red.png', 'port2.png', 'port3_red.png']]
paths.append(ROOT / 'assets/scene2/scene2_back.png')
paths.append(ROOT / 'assets/loot/sword.png')
assets = {p.relative_to(ROOT).as_posix(): 'data:image/png;base64,' +
          base64.b64encode(p.read_bytes()).decode('ascii') for p in paths}
html = (ROOT / 'index.html').read_text()
for script in ['assets-manifest.js', 'scene2.js']:
    html = html.replace(f'<script src="{script}"></script>', '<script>' + (ROOT / script).read_text() + '</script>')
html = html.replace('const EMBEDDED = null;', 'const EMBEDDED = ' + json.dumps(assets) + ';')
(ROOT / 'dist').mkdir(exist_ok=True)
out = ROOT / 'dist/playable.html'
out.write_text(html)
print(f'{out}: {out.stat().st_size:,} bytes')
