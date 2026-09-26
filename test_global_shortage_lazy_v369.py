from pathlib import Path
import re, sys
html=Path('app/src/main/assets/index.html').read_text()
mod=Path('app/src/main/assets/global_shortage_v369.js').read_text()
checks=[]
def ok(name, cond):
    checks.append((name,bool(cond)))

ok('tab shell exists', 'id="shortage" class="page"' in html)
ok('navigation button exists', 'data-page="shortage"' in html)
ok('module asset is not statically loaded', not re.search(r'<script[^>]+src=["\']global_shortage_v369\.js["\']', html))
ok('dynamic asset loader exists', "sc.src='global_shortage_v369.js'" in html)
ok('user-click guard exists', "if(!userAction)return Promise.resolve(null)" in html)
ok('nav only initializes shortage on userAction', "if(page==='shortage'&&userAction)openGlobalShortageTabV369" in html)
ok('startup renderAll excludes shortage renderer', "['shortage'" not in html[html.find('function renderAll()'):html.find('function navTo(',html.find('function renderAll()'))])
block=html[html.find('function loadModuleSpecV44('):html.find('function loadPriorityForV44(')]
ok('loading scheduler has no shortage spec', "page==='shortage'" not in block)
ok('startup core contains no shortage API adapter calls', not any(x in html[:html.find('/* v3.6.9 · Global Shortage strict lazy loader')] for x in ['GlobalShortageV369.init','GlobalShortageV369.refresh']))
ok('module owns source adapter calls', all(x in mod for x in ['ensureUsOilV24','ensureUsGasV24','ensureEuGasV33']))
ok('module distinguishes price from physical score', 'Price excluded from Shortage Risk Score' in mod and 'price is not used in the physical score' in mod)
ok('missing evidence remains N/A', "status:'N/A',score:null" in mod)
ok('coverage gate exists', 'coverage.pct>=25' in mod)
ok('observation and retrieval are separate fields', 'observation:' in mod and 'retrieved:' in mod)
ok('41 monitored chains', len(re.findall(r"\['[^']+'\s*,\s*'[^']+'\s*,\s*'[^']+'\]", mod[mod.find('const CATALOG=['):mod.find('].map(([id,name,category])')]))==41)
for name,passed in checks: print(('PASS' if passed else 'FAIL')+': '+name)
failed=[x for x in checks if not x[1]]
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)} passed')
sys.exit(1 if failed else 0)
