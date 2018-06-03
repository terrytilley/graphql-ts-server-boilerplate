import fetch from 'node-fetch';

describe('Confirm email', () => {
  it('sends invalid back if bad ID sent', async () => {
    const response = await fetch(`${process.env.TEST_HOST}/confirm/12345`);
    const text = await response.text();
    expect(text).toEqual('invalid');
  });
});
