const configs = require("../../configs");

module.exports = (next) => {
	return async (matches, event, api, extra) => {
		let sentPrefix = event.body.substring(0, 1);
		let defPrefix = configs.DEFAULT_PREFIX;
		
		if(sentPrefix !== defPrefix)
		    return;
		
		if(matches.length === 0)
		    return;
		
		
		
		await next(matches, event, api, extra);
	};
};