// core/__tests__/Const.spec.js
const Const = require('../Const');

describe('Const.js — перевірка констант', () => {
  it('має правильне значення payTime (15 хвилин у мс)', () => {
    expect(Const.payTime).toBe(15 * 60 * 1000);
  });

  it('мінімальні та максимальні ліміти платежу', () => {
    expect(Const.minPaymentLimit).toBe(500);
    expect(Const.maxPaymentLimit).toBe(200000);
  });

  it('payment.statusList містить очікувані статуси', () => {
    expect(Const.payment.statusList).toMatchObject({
      ACTIVE: 'ACTIVE',
      BLOCKED: 'BLOCKED',
      SUCCESS: 'SUCCESS',
      REJECT: 'REJECT'
    });
  });

  it('proof.activeStatusList містить WAIT та MANUAL', () => {
    expect(Const.proof.activeStatusList).toEqual(
      expect.arrayContaining(['WAIT', 'MANUAL'])
    );
  });
});
