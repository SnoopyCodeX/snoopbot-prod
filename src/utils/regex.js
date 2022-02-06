const multilineRegex = (pattern, str) => {
	const regex = pattern;
	const matches = [];
	let m;
	
	while(( m = regex.exec(str) ) !== null) {
		if(m.index === regex.lastIndex)
		    regex.lastIndex++;
		
		m.forEach((match) => matches.push(match));
	}
	
	return matches;
};

module.exports = {
	escape,
	multilineRegex
};