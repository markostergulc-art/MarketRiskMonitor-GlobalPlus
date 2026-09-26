from pathlib import Path
import re, subprocess, sys, json
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'app.js').read_text()
html=(ROOT/'app/src/main/assets/index.html').read_text()
gradle=(ROOT/'app/build.gradle').read_text()
main_java=(ROOT/'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java').read_text()
store_java=(ROOT/'app/src/main/java/com/marko/marketrisk/globalplus/Trading212CredentialsStore.java').read_text()
scripts=re.findall(r'<script(?:[^>]*)>(.*?)</script>',html,flags=re.S|re.I)
checks={
 'versionName': "versionName '3.5.1.72'" in gradle,
 'versionCode': 'versionCode 105' in gradle,
 'appJsSync': app.strip()==scripts[-1].strip(),
 't212PositionsEndpoint': '/api/v0/equity/positions' in app and '/api/v0/equity/positions' in main_java,
 'readOnlyNoOrders': '/equity/orders' not in app[app.index('const TRADING212_POSITIONS_ENDPOINT_V72'):app.index('// v3.5.1.71 · Equity representatives',app.index('const TRADING212_POSITIONS_ENDPOINT_V72'))],
 'stockBadge': 'trading212BadgeV72(row.s)' in app,
 'etfBadge': 'capitalRotationProxyHtmlV72' in app and 'CAPITAL_ROTATION_ETF_SYMBOLS_V72' in app,
 'states': all(x in app for x in ['T212 ✓ PORTFELJ','T212 — NIJE','T212 · NIJE POVEZANO']),
 'secureSourceStore': 'AndroidKeyStore' in store_java and 'AES/GCM/NoPadding' in store_java,
 'noSecretExport': 't212_ct_v1' not in app,
 'signingP12': (ROOT/'signing/MarketRiskMonitor_GlobalPlus_release.p12').exists(),
 'signingProps': (ROOT/'signing/keystore.properties').exists(),
}
for k,v in checks.items(): print(k,'PASS' if v else 'FAIL')
if not all(checks.values()): sys.exit(1)
# Runtime matching test against representative Trading 212 ticker formats.
js=r'''
function norm(raw,fromT212=false){let s=String(raw||'').trim().toUpperCase();if(!s)return'';if(fromT212)s=s.split('_')[0]||s;else{s=s.replace(/=X$/,'');if(s.includes('.'))s=s.split('.')[0]}return s.replace(/[^A-Z0-9]/g,'')}
const positions=['AAPL_US_EQ','BRKb_US_EQ','ASML_NL_EQ','7203_JP_EQ','SPY_US_EQ'].map(x=>norm(x,true));
const held=new Set(positions);
const tests=[['AAPL',true],['BRK-B',true],['ASML.AS',true],['7203.T',true],['SPY',true],['QQQ',false]];
for(const [s,want] of tests){let got=held.has(norm(s,false));if(got!==want)throw new Error(s+' expected '+want+' got '+got)}
console.log('T212_SYMBOL_MATCHING_PASS');
'''
r=subprocess.run(['node','-e',js],capture_output=True,text=True)
print(r.stdout,end=''); print(r.stderr,end='',file=sys.stderr)
sys.exit(r.returncode)
