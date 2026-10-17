"""Independent holdout acceptance. Unknown truth/abstention never manufacture success."""
import argparse, collections, hashlib, json, math, pathlib, urllib.parse


def ratio(a, b):
    return a / b if b else None


def wilson(success, total):
    if not total:
        return None
    z = 1.959963984540054
    p, n = success / total, total
    center = (p + z*z/(2*n)) / (1 + z*z/n)
    radius = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / (1 + z*z/n)
    return [max(0, center-radius), min(1, center+radius)]


def evaluate(data):
    cases = data['cases']
    errors = []
    ids = [c['id'] for c in cases]
    if len(ids) != len(set(ids)):
        errors.append('DUPLICATE_CASE_ID')
    splits = collections.defaultdict(set)
    for c in cases:
        for key in ('merchantGroup', 'productLineage'):
            if c.get(key):
                splits[(key, c[key])].add(c.get('split'))
    if any('holdout' in s and len(s) > 1 for s in splits.values()):
        errors.append('HOLDOUT_GROUP_LEAKAGE')
    tasks = {}
    for task in sorted({c['task'] for c in cases}):
        rows = [c for c in cases if c['task'] == task and c.get('split') == 'holdout']
        eligible = []
        rejected = []
        for c in rows:
            label = c.get('label', 'unlabeled')
            proof = c.get('proof', {})
            source = urllib.parse.urlsplit(proof.get('sourceUrl', ''))
            if label not in ('positive', 'negative') or proof.get('adjudication') != 'independently-reviewed' or not proof.get('observedAt') or not proof.get('binding') or source.scheme != 'https' or not source.hostname or source.username or not c.get('merchantGroup') or not c.get('productLineage'):
                rejected.append(c['id'])
            else:
                eligible.append(c)
        groups = [c['merchantGroup'] for c in eligible]
        task_errors = list(errors)
        if len(groups) != len(set(groups)):
            task_errors.append('DUPLICATE_HOLDOUT_MERCHANT')
        tp = fp = tn = fn = abstain = missing = 0
        for c in eligible:
            prediction = c.get('prediction', 'unavailable')
            if prediction not in ('positive', 'negative', 'abstain', 'unavailable', 'error'):
                task_errors.append('INVALID_PREDICTION:' + c['id'])
                prediction = 'error'
            if prediction in ('unavailable', 'error'):
                missing += 1
            if prediction not in ('positive', 'negative'):
                abstain += 1
            if c['label'] == 'positive':
                if prediction == 'positive':
                    tp += 1
                else:
                    fn += 1  # Includes unavailable pages and abstentions.
            elif prediction == 'positive':
                fp += 1
            elif prediction == 'negative':
                tn += 1
        positives = sum(c['label'] == 'positive' for c in eligible)
        negatives = len(eligible)-positives
        recall, precision, fpr = ratio(tp, positives), ratio(tp, tp+fp), ratio(fp, negatives)
        enough = positives >= 50 and negatives >= 50 and len(set(groups)) >= 100
        passed = enough and not task_errors and recall is not None and recall >= .59 and precision is not None and precision >= .95 and fpr is not None and fpr <= .05
        tasks[task] = dict(status='PASS' if passed else 'BELOW_TARGET' if enough and not task_errors else 'NOT_EVALUABLE', eligible=len(eligible), rejectedHoldoutIds=rejected, positiveGroups=positives, negativeGroups=negatives, tp=tp, fp=fp, tn=tn, fn=fn, abstained=abstain, unavailable=missing, recall=recall, precision=precision, falsePositiveRate=fpr, coverage=ratio(len(eligible)-abstain, len(eligible)), recall95=wilson(tp, positives), precision95=wilson(tp, tp+fp), fpr95=wilson(fp, negatives), errors=task_errors)
    return dict(protocol='DS-061-59', target=dict(recall=.59, precision=.95, falsePositiveRate=.05, minimumPositiveMerchantGroups=50, minimumNegativeMerchantGroups=50), status='PASS' if tasks and all(t['status'] == 'PASS' for t in tasks.values()) else 'NOT_ACCEPTED', totalCases=len(cases), tasks=tasks)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('manifest', type=pathlib.Path)
    parser.add_argument('output', type=pathlib.Path)
    parser.add_argument('--assert-target', action='store_true')
    args = parser.parse_args()
    raw = args.manifest.read_bytes()
    result = evaluate(json.loads(raw))
    result['manifestSha256'] = hashlib.sha256(raw).hexdigest()
    args.output.write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps({'status': result['status'], 'tasks': {k:v['status'] for k,v in result['tasks'].items()}}))
    if args.assert_target and result['status'] != 'PASS':
        raise SystemExit(2)
