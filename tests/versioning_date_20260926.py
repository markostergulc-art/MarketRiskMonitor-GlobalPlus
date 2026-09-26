from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
gradle=(root/'app/build.gradle').read_text()
idx=(root/'app/src/main/assets/index.html').read_text()
app=(root/'app.js').read_text()
excel=(root/'app/src/main/assets/excel_export_v362.js').read_text()
assert "versionCode 124" in gradle
assert "versionName '2026.09.26.1'" in gradle
assert '· 2026.09.26.1' in idx
assert "EXPORT_V47_VERSION='2026.09.26.1',EXPORT_V47_CODE=124" in app
assert "XLSX_VERSION_V362='2026.09.26.1'" in excel
assert "XLSX_VERSION_CODE_V362=124" in excel
# User-visible production runtime must not advertise old release numbering.
assert '· v3.10' not in idx
print('versioning_date_20260926: PASS')
