const fs = require("fs");
const configs = require("../../configs");

module.exports = (next) => {
	return async (matches, event, api, extra) => {
		let threadWhitelist = JSON.parse(fs.readFileSync(configs.APP_THREAD_WHITELIST_FILE, {encoding: "utf8"}));
		let adminWhitelist = JSON.parse(fs.readFileSync(configs.APP_PERMISSION_FILE, {encoding: "utf8"}));
		
        if(!threadWhitelist.threads.includes(event.threadID) && !adminWhitelist.admins.includes(event.senderID))
            return false;
        
        await next(matches, event, api, extra);
	};
};