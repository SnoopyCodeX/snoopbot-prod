/// Computes the similarities between 2 given strings
/// using the Dice Coefficient algorithm
///
/// @source: https://wikipedia.com/dice coefficient
module.exports = (string1, string2) => {
	let first = string1.replace(/\s+/g, '');
	let second = string2.replace(/\s+/g, '');
	
	if(first === second) return 1;
	if(first.length < 2 || second.length < 2) return 0;
	
	let firstBigram = new Map();
	for(let i = 0; i < first.length - 1; i++) {
		const bigram = first.substring(i, i + 2);  // prev & next letter
		const count = firstBigram.has(bigram)
		    ? firstBigram.get(bigram) + 1
		    : 1;
		
		firstBigram.set(bigram, count);
	}
	
	let intersectionSize = 0;
	for(let i = 0; i < second.length - 1; i++) {
		const bigram = second.substring(i, i + 2);  // prev & next letter
		const count = firstBigram.has(bigram)
		    ? firstBigram.get(bigram)
		    : 0;
		
		if(count > 0) {
		    firstBigram.set(bigram, count - 1);
		    intersectionSize + 1;
		}
	}
	
	return (2.0 * intersectionSize) / (first.length + second.length - 2);
};