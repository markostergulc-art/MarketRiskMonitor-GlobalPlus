from pathlib import Path
import hashlib,re,zipfile,subprocess,sys
ROOT=Path(__file__).resolve().parent
BASE=Path('/mnt/data/mrm118_orig')
BASE_APK=Path('/mnt/data/MarketRiskMonitor_GlobalPlus_v3.6.8_BUILD118_signed.apk')
NEW_APK=ROOT/'MarketRiskMonitor_GlobalPlus_v3.6.9_BUILD119_signed.apk'
checks=[]
def ck(name,cond): checks.append((name,bool(cond))); print(('PASS' if cond else 'FAIL')+': '+name)

gradle=(ROOT/'app/build.gradle').read_text()
ck('versionName 3.6.9',"versionName '3.6.9'" in gradle)
ck('versionCode 119','versionCode 119' in gradle)
ck('applicationId unchanged',"applicationId 'com.marko.marketrisk.globalplus'" in gradle)

html=(ROOT/'app/src/main/assets/index.html').read_text()
app=(ROOT/'app.js').read_text()
blocks=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S)
main=max(blocks,key=len)
ck('canonical app.js equals embedded main runtime',main==app)
ck('shortage asset not statically loaded','<script src="global_shortage_v369.js"' not in html)
ck('shortage loader is dynamic',"sc.src='global_shortage_v369.js'" in app)
ck('shortage user click gate exists',"page==='shortage'&&userAction" in app)
ck('manual Refresh routes initialized shortage separately',"p==='shortage'" in app and 'openGlobalShortageTabV369(true,true)' in app)

# Existing standalone supplemental assets must be byte-identical to BUILD118 except release-metadata export asset.
for rel in ['app/src/main/assets/t212_portfolio_v363.js','app/src/main/assets/capital_rotation_contributors_v366.js','app/src/main/assets/capital_rotation_ui_v367.js','app/src/main/assets/app_icon.png','app/src/main/res/drawable-nodpi/app_icon.png','app/src/main/AndroidManifest.xml','app/src/main/res/values/styles.xml','app/src/main/res/xml/network_security_config.xml','app/src/main/java/com/marko/marketrisk/globalplus/RiskDatabase.java','app/src/main/java/com/marko/marketrisk/globalplus/Trading212CredentialsStore.java','app/src/main/java/com/marko/marketrisk/globalplus/AgsiKeyStore.java','app/src/main/java/com/marko/marketrisk/globalplus/BackgroundRefreshScheduler.java']:
    a=BASE/rel; b=ROOT/rel
    if a.exists() and b.exists(): ck('protected baseline unchanged: '+rel,a.read_bytes()==b.read_bytes())

with zipfile.ZipFile(BASE_APK) as a, zipfile.ZipFile(NEW_APK) as b:
    ck('native classes.dex unchanged from BUILD118',a.read('classes.dex')==b.read('classes.dex'))
    for name in ['assets/t212_portfolio_v363.js','assets/capital_rotation_contributors_v366.js','assets/capital_rotation_ui_v367.js','assets/app_icon.png','res/drawable/app_icon.png']:
        ck('APK protected asset unchanged: '+name,a.read(name)==b.read(name))
    ck('APK contains lazy shortage module','assets/global_shortage_v369.js' in b.namelist())
    ck('APK embedded index matches source',b.read('assets/index.html')==(ROOT/'app/src/main/assets/index.html').read_bytes())
    ck('APK shortage module matches source',b.read('assets/global_shortage_v369.js')==(ROOT/'app/src/main/assets/global_shortage_v369.js').read_bytes())

failed=[n for n,c in checks if not c]
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)} passed')
sys.exit(1 if failed else 0)
