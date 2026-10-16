import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewDateMillis} from '../src/languages/commerce-date';
for(const date of ['2026年10月9日','९ अक्टूबर २०२६','9 octubre 2026','٩ أكتوبر ٢٠٢٦','9 octobre 2026','৯ অক্টোবর ২০২৬','9 outubro 2026','October 9, 2026'])test(`Gregorian review date: ${date}`,()=>assert.equal(reviewDateMillis(date),Date.UTC(2026,9,9)));
test('ambiguous numeric and other-calendar/invalid dates remain unknown',()=>{for(const date of ['09/10/26','31 février 2026','١ محرم ١٤٤٨','১ বৈশাখ ১৪৩৩','2026年13月9日'])assert.equal(Number.isNaN(reviewDateMillis(date)),true,date);});
