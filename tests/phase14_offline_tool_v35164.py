#!/usr/bin/env python3
import csv, importlib.util, json, math, shutil, tempfile, sys
from datetime import date, timedelta
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TOOL=ROOT/'tools'/'historical_validation_v35164.py'
spec=importlib.util.spec_from_file_location('histv64',TOOL); m=importlib.util.module_from_spec(spec); sys.modules['histv64']=m; spec.loader.exec_module(m)
passed=failed=0
def ok(cond,name,detail=''):
    global passed,failed
    if cond:
        print('PASS - '+name); passed+=1
    else:
        print('FAIL - '+name+((' :: '+detail) if detail else '')); failed+=1

def trading_days(start,n):
    d=date.fromisoformat(start); out=[]
    while len(out)<n:
        if d.weekday()<5: out.append(d.isoformat())
        d+=timedelta(days=1)
    return out

def write_series(path,rows):
    with open(path,'w',newline='',encoding='utf-8') as f:
        w=csv.writer(f);w.writerow(['date','value']);w.writerows(rows)

with tempfile.TemporaryDirectory() as td:
    td=Path(td); days=trading_days('2019-01-01',420)
    market=[];hy=[];vix=[];rec=[]
    for i,d in enumerate(days):
        # benign rising first half, stressed fall then recovery second half
        if i<210: val=100+i*.1
        elif i<260: val=121-(i-210)*.6
        else: val=91+(i-260)*.2
        market.append((d,val));hy.append((d,300+(max(0,i-210) if i<260 else 50)));vix.append((d,20+(25 if 225<=i<=245 else 0)))
        if i%21==0: rec.append((d,1 if 230<=i<=250 else 0))
    write_series(td/'market.csv',market);write_series(td/'hy.csv',hy);write_series(td/'vix.csv',vix);write_series(td/'rec.csv',rec)
    factors={k:50 for k in m.FACTOR_WEIGHTS}
    snaps=[]
    # 40 PIT snapshots, scores separated enough to test classification
    for j,i in enumerate(range(150,350,5)):
        score=75 if 205<=i<=255 else 30
        snaps.append({'asOf':days[i],'capturedAt':days[i]+'T18:00:00Z','globalScore':score,'factorScores':dict(factors),'pointInTime':{'captureMode':'LIVE_RUNTIME_SNAPSHOT','capturedAt':days[i]+'T18:00:00Z','reconstructed':False}})
    # strict failures
    snaps.append({'asOf':days[100],'globalScore':50,'factorScores':dict(factors),'vintageInputs':[{'name':'macro'}]})
    snaps.append({'asOf':days[100],'globalScore':50,'factorScores':dict(factors),'vintageInputs':[{'name':'macro','availableAt':days[101]}]})
    (td/'snapshots.json').write_text(json.dumps(snaps),encoding='utf-8')
    outdir=td/'out'
    args=m.build_parser().parse_args(['--snapshots',str(td/'snapshots.json'),'--market',str(td/'market.csv'),'--hy-oas',str(td/'hy.csv'),'--vix',str(td/'vix.csv'),'--recession',str(td/'rec.csv'),'--output-dir',str(outdir)])
    summary=m.run(args)
    ok(summary['eligibleSnapshots']==40,'strict PIT accepts live snapshots')
    ok(summary['rejectedSnapshots']==2,'strict PIT rejects unverified/look-ahead reconstructions')
    rejected=json.loads((outdir/'rejected_snapshots.json').read_text())
    reasons={r['reason'] for r in rejected};ok('VINTAGE_UNVERIFIED' in reasons and 'LOOKAHEAD_INPUT' in reasons,'rejection reasons distinguish missing vintage and look-ahead')
    for fn in ['manifest.json','summary.json','rejected_snapshots.json','threshold_study.json','weight_sensitivity.json','event_windows.json','event_lead.json','observations.json','observations.csv','metrics.json','metrics.csv','eligible_snapshots.csv']:
        ok((outdir/fn).is_file(),'offline output exists: '+fn)
    manifest=json.loads((outdir/'manifest.json').read_text());
    ok(manifest['strictPointInTime'] is True,'manifest records strict PIT mode')
    ok(manifest['productionWeightsChanged'] is False and manifest['productionThresholdsChanged'] is False,'manifest forbids production retuning')
    ok(manifest['horizonsTradingDays']==[21,63,126,252],'manifest exposes four trading-day horizons')
    obs=json.loads((outdir/'observations.json').read_text())
    ok(len(obs)==160,'four forward horizons emitted per eligible snapshot')
    complete=[r for r in obs if r['status']=='COMPLETE'];ok(len(complete)>0,'forward outcomes calculated where future data exist')
    one=next(r for r in obs if r['status']=='COMPLETE' and r['horizon']==21)
    base_i=days.index(one['baseDate']);ok(one['endDate']==days[base_i+21],'21D endpoint is exactly 21 trading observations forward')
    ok(one['noLookaheadScoreInputs'] is True,'outcome row explicitly preserves no-lookahead score-input rule')
    ok(isinstance(one['forwardVolatilityPct'],(int,float)) and math.isfinite(one['forwardVolatilityPct']),'forward volatility finite')
    ok(one['recessionOnset'] in (True,False,None),'recession outcome tri-state')
    metrics=json.loads((outdir/'metrics.json').read_text());
    ok(len(metrics)==16,'metrics cover 4 horizons x 4 current thresholds')
    ok(all(x['threshold'] in [25,45,60,75] for x in metrics),'production thresholds tested without changing them')
    ok(all('rocAuc' in x and 'prAuc' in x and 'confusionMatrix' in x for x in metrics),'metrics include ROC-AUC, PR-AUC and confusion matrix')
    ts=json.loads((outdir/'threshold_study.json').read_text());
    ok(all(v['productionThresholdChanged'] is False for v in ts.values()),'threshold studies remain diagnostic only')
    sens=json.loads((outdir/'weight_sensitivity.json').read_text());
    ok(len(sens['rows'])==10 and sens['productionWeightsChanged'] is False,'±20% sensitivity covers 10 factors without mutation')
    ok(all(r['baselineWeight']==m.FACTOR_WEIGHTS[r['factor']] for r in sens['rows']),'sensitivity retains baseline factor weights')
    lead=json.loads((outdir/'event_lead.json').read_text());
    ok(lead['eventCount']==8,'default event registry includes eight requested analytical windows')
    events=json.loads((outdir/'event_windows.json').read_text());
    ok(all(e['boundaryType']=='ANALYTICAL_REFERENCE_NOT_OFFICIAL' for e in events),'event windows are explicitly analytical/non-official')
    ok(summary['realHistoricalValidationClaimed'] is False,'fixture run does not claim real historical predictive validation')

# direct function tests
live={'asOf':'2020-01-10','pointInTime':{'captureMode':'LIVE_RUNTIME_SNAPSHOT','capturedAt':'2020-01-10T18:00:00Z'}}
ok(m.vintage_eligibility(live,True)['eligible'],'direct PIT live eligibility')
ok(m.vintage_eligibility({'asOf':'2020-01-10','vintageInputs':[{'name':'x','availableAt':'2020-01-11'}]},True)['reason']=='LOOKAHEAD_INPUT','direct look-ahead rejection')
rows=[{'score':80,'target':True},{'score':70,'target':True},{'score':30,'target':False},{'score':20,'target':False}]
cm=m.confusion(rows,60);ok((cm['tp'],cm['fp'],cm['tn'],cm['fn'])==(2,0,2,0),'direct confusion matrix exact')
ok(m.roc_auc(rows)==1.0 and m.pr_auc(rows)==1.0,'direct perfect ROC/PR AUC')
ok(m.threshold_study(rows)['historicallySuggestedThreshold'] is None,'suggestion gated below 30 labelled rows')

print(f'RESULT - {passed}/{passed+failed} Phase 14 offline-tool checks '+('FAIL' if failed else 'PASS'))
raise SystemExit(1 if failed else 0)
