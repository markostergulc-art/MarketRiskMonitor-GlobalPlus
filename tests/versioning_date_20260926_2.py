from pathlib import Path
gradle=Path('app/build.gradle').read_text(); idx=Path('app/src/main/assets/index.html').read_text(); app=Path('app.js').read_text(); excel=Path('app/src/main/assets/excel_export_v362.js').read_text()
assert "versionCode 125" in gradle
assert "versionName '2026.09.26.2'" in gradle
assert '· 2026.09.26.2</div>' in idx
assert "EXPORT_V47_VERSION='2026.09.26.2',EXPORT_V47_CODE=125" in app
assert "XLSX_VERSION_V362='2026.09.26.2'" in excel and 'XLSX_VERSION_CODE_V362=125' in excel
print('versioning 2026.09.26.2 / BUILD125: PASS')
