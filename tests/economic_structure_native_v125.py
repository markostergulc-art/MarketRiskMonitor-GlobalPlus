from pathlib import Path
j=Path('app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java').read_text()
for h in ['comtradeapi.un.org','api.data.apps.fao.org','www.sciencebase.gov']:
 assert ('"'+h+'"') in j, h
assert 'maxUpstreamBytesForHost' in j
assert '10 * 1024 * 1024' in j
print('economic structure native allowlist/source limits: PASS')
