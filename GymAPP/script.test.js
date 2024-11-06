const { sum } = require('./script');

test('hello world!', () => {
	expect(sum(1, 2)).toBe(3);
});