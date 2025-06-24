// layers/controllers/__tests__/Task.controller.spec.js

// Використовуємо fake timers для завдань із setTimeout
jest.useFakeTimers();

// 1. Мок моделі Task
jest.mock('@models/Task.model', () => {
  function Task(data) { Object.assign(this, data); }
  Task.prototype.save = jest.fn().mockResolvedValue(null);
  Task.find = jest.fn();
  Task.deleteOne = jest.fn().mockResolvedValue(null);
  return Task;
});

// 2. Імпорт тестованих функцій
const { push, query } = require('@controllers/Task.controller');
const Task = require('@models/Task.model');

describe('Task.controller.push', () => {
  const sample = {
    _id: 't1',
    type: 'CLOSE',
    payload: { invoice: 'inv1' },
    timestamp: Date.now() + 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('зберігає нове завдання через Task.save()', async () => {
    // Викликаємо push
    const p = push(sample);
    // Швидко проганяємо всі таймери, щоб load() і handle() не засмічували логи
    jest.runAllTimers();
    await p;

    // Перевіряємо, що save() був викликаний
    expect(Task.prototype.save).toHaveBeenCalled();
  });
});

describe('Task.controller.query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('знаходить усі завдання через Task.find()', async () => {
    const tasks = [{ _id: 'a' }, { _id: 'b' }];
    Task.find.mockResolvedValue(tasks);

    await expect(query()).resolves.toBeUndefined();

    expect(Task.find).toHaveBeenCalled();
  });
});
