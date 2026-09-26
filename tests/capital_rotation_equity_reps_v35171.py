from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'app/src/main/assets/index.html').read_text()
gradle=(ROOT/'app/build.gradle').read_text()
app=(ROOT/'app.js').read_text().strip()
scripts=re.findall(r'<script(?:[^>]*)>(.*?)</script>',html,flags=re.S|re.I)
main=scripts[-1].strip()
checks={
 'versionName': "versionName '3.5.1.71'" in gradle,
 'versionCode': 'versionCode 104' in gradle,
 'appJsSync': app==main,
 'groups14': html.count('rankMode:')>=14,
 'concreteExposure': 'Konkretna izloženost' in html and 'Mjereni proxy' in html,
 'top10Section': 'DIONICE · 10 NAJVEĆIH PREDSTAVNIKA' in html,
 'marketCapEndpoint': '/ws/fundamentals-timeseries/v1/finance/timeseries/' in html and 'trailingMarketCap' in html,
 'lazyOnly': html.count('ensureCapitalRotationRepGroupV71(')==3,
 'noScoreMutationCopy': 'ne mijenjaju Capital Rotation score' in html,
 'marketCapNANotZero': 'marketCap=null' in html,
 'signingP12': (ROOT/'signing/MarketRiskMonitor_GlobalPlus_release.p12').exists(),
 'signingProps': (ROOT/'signing/keystore.properties').exists(),
}
for k,v in checks.items(): print(k,'PASS' if v else 'FAIL')
if not all(checks.values()): sys.exit(1)
print('ALL CURRENT-SOURCE QA PASS')
