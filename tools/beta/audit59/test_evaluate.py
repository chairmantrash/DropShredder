import unittest
from evaluate import evaluate

def case(i, label='positive', prediction='positive', split='holdout'):
    return dict(id=str(i),task='deceptive-provenance',merchantGroup=f'm{i}.example',productLineage=f'lineage{i}',split=split,label=label,prediction=prediction,proof=dict(sourceUrl='https://authority.example/finding',observedAt='2026-10-17',binding='exact merchant/product and claim',adjudication='independently-reviewed'))

class EvaluationContracts(unittest.TestCase):
    def metrics(self, rows):
        return evaluate(dict(cases=rows))['tasks']['deceptive-provenance']

    def test_unknown_truth_never_counts_as_benign(self):
        r=self.metrics([case(1,'unlabeled','negative')]);self.assertEqual(r['eligible'],0);self.assertIsNone(r['falsePositiveRate']);self.assertEqual(r['status'],'NOT_EVALUABLE')

    def test_all_abstaining_is_not_perfect_precision(self):
        r=self.metrics([case(1,prediction='abstain')]);self.assertEqual(r['fn'],1);self.assertEqual(r['recall'],0);self.assertIsNone(r['precision'])

    def test_unavailable_positive_stays_in_recall_denominator(self):
        r=self.metrics([case(1),case(2,prediction='unavailable')]);self.assertEqual(r['recall'],.5);self.assertEqual(r['unavailable'],1)

    def test_negative_abstention_is_not_a_true_negative(self):
        r=self.metrics([case(1,'negative','abstain')]);self.assertEqual(r['tn'],0);self.assertEqual(r['coverage'],0)

    def test_false_positive_penalizes_both_precision_and_fpr(self):
        r=self.metrics([case(1),case(2,'negative','positive')]);self.assertEqual(r['precision'],.5);self.assertEqual(r['falsePositiveRate'],1)

    def test_shared_product_lineage_invalidates_holdout(self):
        a,b=case(1),case(2,split='development');b['productLineage']=a['productLineage'];self.assertIn('HOLDOUT_GROUP_LEAKAGE',self.metrics([a,b])['errors'])

    def test_duplicate_merchant_does_not_inflate_acceptance(self):
        a,b=case(1),case(2);b['merchantGroup']=a['merchantGroup'];self.assertIn('DUPLICATE_HOLDOUT_MERCHANT',self.metrics([a,b])['errors'])

    def test_small_perfect_sample_does_not_certify_target(self):
        self.assertEqual(self.metrics([case(1)])['status'],'NOT_EVALUABLE')

    def test_sample_target_enforces_false_positives_as_well_as_recall(self):
        rows=[case(i,prediction='positive' if i<30 else 'abstain') for i in range(50)]+[case(i,'negative','negative') for i in range(50,100)];self.assertEqual(self.metrics(rows)['status'],'PASS');rows[-1]['prediction']='positive';rows[-2]['prediction']='positive';self.assertEqual(self.metrics(rows)['status'],'BELOW_TARGET')

    def test_missing_source_binding_is_not_independent_truth(self):
        a=case(1);a['proof'].pop('binding');self.assertEqual(self.metrics([a])['eligible'],0)

if __name__=='__main__':unittest.main()
