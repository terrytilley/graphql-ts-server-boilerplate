import fetch from 'node-fetch';

test('sends invalid back if bad ID sent', async () => {
  const response = await fetch(`${process.env.TEST_HOST}/confirm/12345`);
  const text = await response.text();
  expect(text).toEqual('invalid');
});
