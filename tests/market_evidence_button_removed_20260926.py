from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
app=(root/'app.js').read_text()
m=re.search(r'function marketCard\(c\)\{([\s\S]*?)\nfunction globalDriverRowHtmlV66',app)
assert m, 'marketCard block missing'
block=m.group(0)
assert 'data-evidence-target="COUNTRY:' not in block
assert '>EVIDENCE<' not in block
# Evidence/provenance infrastructure must remain for global/alerts/export.
assert "'COUNTRY:'+x.code" in app
assert 'currentEvidence' in app
print('market_evidence_button_removed_20260926: PASS')
