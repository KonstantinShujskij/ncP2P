// middleware/__tests__/file.middleware.spec.js

// 1) Мокаємо multer так, щоб він мав diskStorage та був викликається як функція
jest.mock('multer', () => {
  const m = jest.fn(opts => opts);
  m.diskStorage = jest.fn(config => config);
  return m;
});

const multer = require('multer');
const fileMiddleware = require('../file.middleware');

describe('middleware/file.middleware', () => {
  // Після mock multer({storage, fileFilter}) повертає об’єкт { storage, fileFilter }
  const { storage, fileFilter } = fileMiddleware;

  describe('storage.destination()', () => {
    it('має повертати папку static/kvits/', done => {
      storage.destination({}, {}, (err, folder) => {
        expect(err).toBeNull();
        expect(folder).toBe('static/kvits/');
        done();
      });
    });
  });

  describe('storage.filename()', () => {
    beforeAll(() => {
      jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-02T03:04:05Z'));
    });
    afterAll(() => {
      jest.useRealTimers();
    });

    it('формує ім’я з ISO-дати та оригінального імені, видаляючи ":" "%" "#"', done => {
      const fakeFile = { originalname: 'inv:01%#x.png' };
      storage.filename({}, fakeFile, (err, name) => {
        expect(err).toBeNull();
        // формат: "2020-01-02T03-04-05.000Z-inv-01x.png"
        expect(name).toMatch(/^2020-01-02T03-04-05\.\d{3}Z-inv-01x\.png$/);
        done();
      });
    });
  });

  describe('fileFilter()', () => {
    const cb = jest.fn();

    beforeEach(() => cb.mockClear());

    it('дозволяє PDF', () => {
      fileFilter({}, { mimetype: 'application/pdf' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('дозволяє PNG', () => {
      fileFilter({}, { mimetype: 'image/png' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('дозволяє JPEG', () => {
      fileFilter({}, { mimetype: 'image/jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('відхиляє інші типи', () => {
      fileFilter({}, { mimetype: 'application/msword' }, cb);
      expect(cb).toHaveBeenCalledWith(null, false);
    });

    it('повертає false, якщо mimetype відсутній', () => {
      fileFilter({}, {}, cb);
      expect(cb).toHaveBeenCalledWith(null, false);
    });
  });
});
