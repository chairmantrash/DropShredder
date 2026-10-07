import assert from 'node:assert/strict';
import test from 'node:test';
import { darkPatternHistoryEvidence } from '../src/analysis/dark-patterns';

test('countdown that resets later is strong evidence',()=>{
 const out=darkPatternHistoryEvidence(
  {checkedAt:'2026-01-01T12:30:00Z',countdownSeconds:900},
  [{checkedAt:'2026-01-01T12:00:00Z',countdownSeconds:120}],
 );
 assert.equal(out.find(x=>x.id==='COUNTDOWN_RESET')?.severity,'strong');
});

test('normally decreasing countdown is not flagged',()=>{
 const out=darkPatternHistoryEvidence(
  {checkedAt:'2026-01-01T12:05:00Z',countdownSeconds:300},
  [{checkedAt:'2026-01-01T12:00:00Z',countdownSeconds:600}],
 );
 assert.equal(out.some(x=>x.id==='COUNTDOWN_RESET'),false);
});

test('same low stock needs repeated separated observations',()=>{
 const out=darkPatternHistoryEvidence(
  {checkedAt:'2026-01-01T15:00:00Z',stockLeft:3},
  [
   {checkedAt:'2026-01-01T12:00:00Z',stockLeft:3},
   {checkedAt:'2026-01-01T13:00:00Z',stockLeft:3},
  ],
 );
 assert.equal(out.some(x=>x.id==='STOCK_SCARCITY_REPLAY'),true);
});

test('subscription disclosure alone has zero accusation weight',()=>{
 const out=darkPatternHistoryEvidence(
  {checkedAt:'2026-01-01T12:30:00Z',subscriptionText:'Subscribe every month and save'},
  [{checkedAt:'2026-01-01T12:00:00Z'}],
 );
 const finding=out.find(x=>x.id==='SUBSCRIPTION_DISCLOSURE');
 assert.equal(finding?.weight,0);
 assert.equal(finding?.severity,'info');
});
