const configs = require("../../configs.js");

module.exports = async (matches, event, api, extra) => {
    let message = "📝 List of Commands\n\n";
    message += "⟩ Prefix: " + configs.DEFAULT_PREFIX + "\n\n";
    
    extra.commands.forEach((command) => {
    	message += command.usage + ": " + command.description + "\n\n";
    });
    
    message += "© Made with ❤️ by John Roy L. Calimlim";
    
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	if(err) return console.log(err);
    
        api.sendMessage(message, event.threadID, event.messageID);
        stopTyping();
    });
};