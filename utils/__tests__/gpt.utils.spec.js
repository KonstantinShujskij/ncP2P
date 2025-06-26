// utils/__tests__/gpt.utils.spec.js

// 1) Мок config
jest.mock('config', () => ({
  get: jest.fn(key => (key === 'gptApiKey' ? 'API_KEY' : undefined))
}));

// 2) Мок OpenAI до імпорту gpt.utils
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } }
  }));
});

// 3) Мок fs та pdf.utils
jest.mock('fs');
jest.mock('../pdf.utils', () => ({
  getKvitText: jest.fn()
}));

const config = require('config');
const fs = require('fs');
const OpenAI = require('openai');
const Pdf = require('../pdf.utils');
const { getData, getImageData, getPdfData } = require('../gpt.utils');

describe('utils/gpt.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getData()', () => {
    it('повертає розпарсені аргументи, якщо tool_calls є', async () => {
      const dummy = { amount: 123, invoice_number: 'ABC' };
      // замінюємо реалізацію create
      const createMock = jest.fn().mockResolvedValue({
        choices: [
          { message: { tool_calls: [ { function: { arguments: JSON.stringify(dummy) } } ] } }
        ]
      });
      OpenAI.mockImplementation(() => ({ chat: { completions: { create: createMock } } }));

      const msgs = [{ role: 'user', content: 'xxx' }];
      const res = await getData(msgs);

      expect(config.get).toHaveBeenCalledWith('gptApiKey');
      expect(createMock).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: msgs,
        tools: expect.any(Array),
        tool_choice: 'auto'
      });
      expect(res).toEqual(dummy);
    });

    it('повертає null, якщо tool_calls відсутні', async () => {
      const createMock = jest.fn().mockResolvedValue({ choices: [ { message: { } } ] });
      OpenAI.mockImplementation(() => ({ chat: { completions: { create: createMock } } }));

      const res = await getData([{ role:'user', content:'hi' }]);
      expect(res).toBeNull();
    });

    it('повертає null при помилці', async () => {
      const createMock = jest.fn().mockRejectedValue(new Error('fail'));
      OpenAI.mockImplementation(() => ({ chat: { completions: { create: createMock } } }));

      const res = await getData([]);
      expect(res).toBeNull();
    });
  });

  describe('getImageData()', () => {
    const dummy = { foo: 'bar' };

    it('конвертує зображення, викликає OpenAI та повертає дані', async () => {
      // підміна FS
      const buf = Buffer.from('imgdata');
      fs.readFileSync.mockReturnValue(buf);

      // мок OpenAI
      const createMock = jest.fn().mockResolvedValue({
        choices: [
          { message: { tool_calls: [ { function: { arguments: JSON.stringify(dummy) } } ] } }
        ]
      });
      OpenAI.mockImplementation(() => ({ chat: { completions: { create: createMock } } }));

      const result = await getImageData('invoice.jpg');
      const base64 = buf.toString('base64');

      // Перевіряємо, що OpenAI отримав саме ті повідомлення
      expect(createMock).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: expect.any(String) },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}` }
              }
            ]
          }
        ],
        tools: expect.any(Array),
        tool_choice: 'auto'
      });

      expect(result).toEqual(dummy);
    });

    it('повертає null, якщо зображення — пустий буфер', async () => {
      fs.readFileSync.mockReturnValue(Buffer.from(''));
      const res = await getImageData('empty.jpg');
      expect(res).toBeNull();
    });
  });

  describe('getPdfData()', () => {
    const dummy = { x: 1 };

    it('отримує текст PDF, викликає OpenAI та повертає дані', async () => {
      Pdf.getKvitText.mockResolvedValue('PDF TEXT');
      const createMock = jest.fn().mockResolvedValue({
        choices: [
          { message: { tool_calls: [ { function: { arguments: JSON.stringify(dummy) } } ] } }
        ]
      });
      OpenAI.mockImplementation(() => ({ chat: { completions: { create: createMock } } }));

      const res = await getPdfData('file.pdf');
      expect(Pdf.getKvitText).toHaveBeenCalledWith('file.pdf');
      expect(createMock).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Extract data from this invoice PDF.' },
          { role: 'user', content: 'PDF TEXT' }
        ],
        tools: expect.any(Array),
        tool_choice: 'auto'
      });
      expect(res).toEqual(dummy);
    });

    it('повертає null, якщо Pdf.getKvitText повернув null', async () => {
      Pdf.getKvitText.mockResolvedValue(null);
      const res = await getPdfData('missing.pdf');
      expect(res).toBeNull();
    });
  });
});
