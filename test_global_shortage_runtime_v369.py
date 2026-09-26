from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent/'app/src/main/assets'
html=(ROOT/'index.html').read_text('utf-8')
for name in ['excel_export_v362.js','t212_portfolio_v363.js','capital_rotation_contributors_v366.js','capital_rotation_ui_v367.js']:
    txt=(ROOT/name).read_text('utf-8').replace('</script>','<\\/script>')
    html=html.replace(f'<script src="{name}"></script>', '<script>'+txt+'</script>')
html=html.replace('<head>', '<head><base href="https://mrm.local/">', 1)

reqs=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page()
    page.on('request', lambda r:reqs.append(r.url))
    def route_handler(route):
        if route.request.url=='https://mrm.local/global_shortage_v369.js':
            route.fulfill(status=200, body=(ROOT/'global_shortage_v369.js').read_text('utf-8'), content_type='application/javascript')
        else:
            route.abort()
    page.route('**/*', route_handler)
    page.set_content(html, wait_until='domcontentloaded', timeout=30000)
    page.wait_for_timeout(4000)

    before_asset=sum(1 for u in reqs if u.endswith('/global_shortage_v369.js'))
    init_before=page.evaluate('globalShortageLoaderV369.initialized')
    page.evaluate("""(()=>{window.__gsAdapterCalls=0;['ensureUsOilV24','ensureUsGasV24','ensureEuGasV33'].forEach(n=>{const f=window[n];if(typeof f==='function'){window[n]=function(){window.__gsAdapterCalls++;return f.apply(this,arguments)}}});return true})()""")
    page.wait_for_timeout(2000)
    adapter_before=page.evaluate('window.__gsAdapterCalls')

    page.locator('.navbtn[data-page="shortage"]').click()
    page.wait_for_timeout(4500)
    init_after=page.evaluate('globalShortageLoaderV369.initialized && !!window.GlobalShortageV369')
    asset_after=sum(1 for u in reqs if u.endswith('/global_shortage_v369.js'))
    adapter_after=page.evaluate('window.__gsAdapterCalls')
    rendered=page.evaluate("document.getElementById('globalShortageContentV369').textContent.includes('GLOBAL SHORTAGE RISK')")
    page_active=page.evaluate("document.getElementById('shortage').classList.contains('active')")
    offline_state=page.evaluate("document.getElementById('globalShortageContentV369').textContent.includes('State EMPTY')")

    page.locator('.navbtn[data-page="overview"]').click()
    page.locator('.navbtn[data-page="shortage"]').click()
    page.wait_for_timeout(1000)
    still_init=page.evaluate('globalShortageLoaderV369.initialized && !!window.GlobalShortageV369')
    asset_second=sum(1 for u in reqs if u.endswith('/global_shortage_v369.js'))

    tests=[
      ('cold-start shortage module asset requests = 0',before_asset==0),
      ('cold-start initialized = false',init_before is False),
      ('adapter calls after startup settle and before click = 0',adapter_before==0),
      ('explicit click loads module asset exactly once',asset_after==1),
      ('explicit click initializes module',init_after is True),
      ('module invokes physical adapters only after click',isinstance(adapter_after,(int,float)) and adapter_after>=2),
      ('Global Shortage page renders summary',rendered is True),
      ('Global Shortage page active',page_active is True),
      ('offline/no-success state is EMPTY, not fake LIVE',offline_state is True),
      ('second open reuses initialized module',still_init is True),
      ('second open does not request module asset again',asset_second==1),
    ]
    for n,c in tests: print(('PASS' if c else 'FAIL')+': '+n)
    print('MEASURED_PRECLICK_MODULE_ASSET_REQUESTS=',before_asset)
    print('MEASURED_PRECLICK_SHORTAGE_ADAPTER_CALLS=',adapter_before)
    print('POSTCLICK_SHORTAGE_ADAPTER_CALLS=',adapter_after)
    failed=[x for x in tests if not x[1]]
    print(f'RESULT: {len(tests)-len(failed)}/{len(tests)} passed')
    browser.close()
    raise SystemExit(1 if failed else 0)
