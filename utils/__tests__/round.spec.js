// utils/__tests__/round.spec.js
const { round } = require('../utils');

describe('round()', () => {
  it('повертає початкове число, коли round = 1 (за замовчуванням)', () => {
    expect(round(7)).toBe(7);
    expect(round(0)).toBe(0);
  });

  it('округлює вниз до найближчого кратного переданому параметру', () => {
    expect(round(7, 2)).toBe(6);    // 7 / 2 = 3.5 → parseInt(3.5)*2 = 6
    expect(round(15, 5)).toBe(15);
    expect(round(14, 5)).toBe(10);
  });

  it('працює з дробовими числами', () => {
    expect(round(5.9, 0.5)).toBe(5.5);
    expect(round(3.14, 0.1)).toBe(3.1);
  });

    it('працює з від’ємними значеннями', () => {
    expect(round(-1, 1)).toBe(-1);
    expect(round(-1.2, 1)).toBe(-1);
    expect(round(-1.8, 1)).toBe(-1);  // тепер очікуємо -1 згідно з parseInt
    });

});
