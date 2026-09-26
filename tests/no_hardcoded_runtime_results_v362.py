#!/usr/bin/env python3
from pathlib import Path
import re, sys, hashlib
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'app.js').read_text()
html=(ROOT/'app/src/main/assets/index.html').read_text()
java='\n'.join(p.read_text(errors='ignore') for p in (ROOT/'app/src/main/java').rglob('*.java'))
checks=[]
def ck(name, ok, detail=''):
    checks.append((name,bool(ok),detail))

# Exact market-observation fallbacks found during the build-110 audit must never return.
banned_runtime=[
    'COMMODITY_FALLBACK',
    "date:'2026-08-28'", "date:'2026-08-20'", "sourceDate:'2026-09-03'", "q2SourceDate:'2026-07-30'",
    'commercialCrude:424.460', 'spr:286.604', 'totalCrude:711.064', 'gasoline:205.669',
    'distillate:104.187', 'daysSupply:24.4', 'siteInventory:294.1', 'q2NetT:288.9',
    'WGC_CB_MONTHLY', 'WGC_CB_Q2', "FISCAL_V44_IMF_VINTAGE='WEO-2026-04'",
    "rankMode:'issuer'",
]
for token in banned_runtime:
    ck('banned runtime token absent: '+token, token not in app)
ck('fixed DOE Total-row observation regex absent', not re.search(r'Total\\s\+101\\\.8|101\\\.8\\s\*MMB', app))
ck('commodity embedded numeric fallback absent', 'fallbackNum' not in app and 'numericFallback' not in app)
ck('WGC source discovery uses rolling archive', 'wgcMonthArchiveUrlsV111' in app and 'WGC_GOLD_FOCUS_BASE' in app)
ck('WGC quarter discovery uses current landing/candidates', 'wgcDiscoverQuarterV111' in app and 'WGC_GDT_LANDING' in app)
ck('DOE capacity/inventory parse dynamically', 'doeSprTotalFromHtmlV111' in app and 'Current authorized storage capacity' in app)
ck('commodity unavailable is N/A, not embedded observation', 'unavailableCommodityField' in app and "return'<span class=\"pill status-na\">N/A</span>'" in app)
ck('Capital Rotation uses dynamic market-cap ranking', "rankMode:'dynamic-marketcap-usd'" in app and 'capitalRotationDynamicCandidateV111' in app)
ck('Capital Rotation does not restore missing candidates by static order', 'ordered.slice(0,10)' in app and 'top.concat' not in app)
ck('IMF metadata does not claim fixed WEO vintage', "FISCAL_V44_IMF_VINTAGE='CURRENT_DATAMAPPER_RESPONSE'" in app)
ck('export metadata versionCode is build 112', "EXPORT_V47_CODE=112" in app)

# Date literals permitted in runtime are configuration/methodology metadata only:
#  - S&P configured-universe membership snapshot
#  - historical validation event-window definitions
#  - methodology schema/version identifiers
allowed_date_lines=[]; unexpected=[]
for i,line in enumerate(app.splitlines(),1):
    if re.search(r'20\d{2}-[01]\d-[0-3]\d',line):
        if ('SP500_UNIVERSE_ASOF' in line or 'Membership snapshot:' in line or
            'boundaryType:' in line or 'COMMODITY_PHYSICAL_METHOD_V61' in line):
            allowed_date_lines.append(i)
        else:
            unexpected.append((i,line.strip()[:180]))
ck('no unexpected dated current-result literals in app.js', not unexpected, repr(unexpected))

# No known embedded observations in native production code.
for token in ['424.460','286.604','711.064','205.669','104.187','294.1','288.9','2026-08-28','2026-08-20','2026-09-03']:
    ck('native code excludes embedded observation '+token, token not in java)

# Production assets must contain only the live runtime HTML and icon; historical HTML snapshots
# stay outside app/src/main/assets so a normal Gradle build cannot package stale runtimes.
asset_names={p.name for p in (ROOT/'app/src/main/assets').iterdir() if p.is_file()}
ck('no historical HTML snapshots in production assets', not ({'index_v35143_baseline.html','index.html.v72'} & asset_names), repr(asset_names))

# Canonical app.js must be the script embedded in the runtime HTML.
st=html.find("<script>'use strict';")
en=html.find('</script>',st)
embedded=html[st+len('<script>'):en] if st>=0 and en>st else ''
ck('packaged runtime embeds canonical app.js', embedded.rstrip('\n')==app.rstrip('\n'))

# Static universes, model weights, thresholds, window lengths and event windows are allowed methodology/config,
# not market observations. Assert the code still has these categories so this test does not misclassify them.
ck('methodology weights remain explicit configuration', 'GLOBAL_FACTOR_WEIGHTS_V53' in app)
ck('market/security universes remain explicit metadata', 'SP500_ALL' in app and 'ETF_UNIVERSE' in app)
ck('historical validation event windows remain explicit methodology', 'VALIDATION_EVENT_WINDOWS_V64' in app)

passed=sum(1 for _,ok,_ in checks if ok)
for name,ok,detail in checks:
    print(('PASS' if ok else 'FAIL')+': '+name+((' :: '+detail) if (detail and not ok) else ''))
print(f'RESULT {passed}/{len(checks)} PASS')
if passed!=len(checks): sys.exit(1)
