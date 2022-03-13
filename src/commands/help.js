const configs = require("../../configs.js");
const fs = require("fs");

module.exports = async (matches, event, api, extra) => {
    const settingsList = JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
    const settings = settingsList.threads[event.threadID];
    const prefix = settings.prefix ?? "$";

    let message = "📝 List of Commands\n\n";
    message += "⟩ Prefix: " + prefix + "\n\n";
    
    extra.commands.forEach((command) => {
    	message += prefix + command.usage + ": " + command.description + "\n\n";
    });
    
    message += "© Made with ❤️ by John Roy L. Calimlim";
    
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	if(err) return console.log(err);
    
        api.sendMessage(message, event.threadID, event.messageID);
        stopTyping();
    });
};