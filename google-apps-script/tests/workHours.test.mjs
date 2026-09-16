// Run with: npm run test:apps-script
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  machineHours, standardHours, absenteeText, staffHours, isValidTime
} from '../../shared/utils/workHours.js';

test('machine hours leave out the lunch break', () => {
  // Values from the store sheet's machine work log
  assert.equal(machineHours('08:00', '15:43'), 7.22);
  assert.equal(machineHours('16:02', '16:53'), 0.85);
  assert.equal(machineHours('08:00', '16:00'), 7.5);
  assert.equal(machineHours('07:51', '12:23'), 4.53);
  assert.equal(machineHours('12:45', '13:15'), 0.25);
  assert.equal(machineHours('09:00', '09:00'), null);
  assert.equal(machineHours('9:00', ''), null);
  assert.equal(isValidTime('24:00'), false);
  assert.equal(isValidTime('7:30'), true);
});

test('standard hours follow the staff type and Saturdays', () => {
  assert.equal(standardHours('S', '2026-07-29'), 8);
  assert.equal(standardHours('O', '2026-07-29'), 9);
  assert.equal(standardHours('S', '2026-08-01'), 4); // Saturday
  assert.equal(standardHours('O', '2026-08-01'), 9);
});

test('absentees are written like the store sheet', () => {
  const staff = [
    { name: 'A', type: 'S' }, { name: 'B', type: 'S' }, { name: 'C', type: 'O' }, { name: 'D', type: 'O' }
  ];
  assert.equal(absenteeText(staff, ['A', 'B', 'C']), '2S 1O');
  assert.equal(absenteeText(staff, ['D']), '1O');
  assert.equal(absenteeText(staff, []), '');
});

test('staff hours add up the machines each person worked on', () => {
  const staff = [{ name: 'A', type: 'O' }, { name: 'B', type: 'S' }, { name: 'C', type: 'S' }];
  const machines = [
    { machine: '200 gm', start: '08:00', end: '15:43', workers: ['A'] },
    { machine: '100 gm', start: '16:02', end: '16:53', workers: ['A', 'B'] }
  ];
  const [a, b, c] = staffHours('2026-07-29', staff, machines, {
    B: { reason: 'Cleaning' },
    C: { absent: true }
  });
  assert.deepEqual([a.machineHours, a.standard, a.balance, a.machines], [8.07, 9, 0.93, ['200 gm', '100 gm']]);
  assert.deepEqual([b.machineHours, b.standard, b.balance, b.reason], [0.85, 8, 7.15, 'Cleaning']);
  assert.deepEqual([c.absent, c.standard, c.balance], [true, 0, 0]);
});
