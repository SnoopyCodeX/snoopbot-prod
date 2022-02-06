const permissionUtil = require("../utils/permissionUtils");

const permissionMiddleware = (next) => {
	return async (matches, event, api, extra) => {
		if(matches.length == 0) return;
		
		let command = matches[0].split(" ")[0];
		
		if(!permissionUtil.userHasPermission(event.threadID, event.senderID, command)) {
			let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
				if(err) return console.log(err);
				
				let message = "⚠️ You do not have permission to use this command.";
			    api.sendMessage(message, event.threadID, event.messageID);
			    stopTyping();
			});
			
			return;
		}
		
		await next(matches, event, api, extra);
	};
};

module.exports = permissionMiddleware;