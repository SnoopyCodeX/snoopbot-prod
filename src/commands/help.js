const configs = require("../../configs");
const fs = require("fs");

module.exports = async (matches, event, api, extra) => {
    const settingsList = JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
    const settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
    const prefix = settings.prefix;

    let message = "📝 List of Commands\n\n";
    message += `⟩ Prefix: ${prefix}\n\n`;
    
    extra.commands.forEach((command) => {
        message += `${prefix + command.usage}: ${command.description}\n\n`;
    });
    
    message += "© Made with ❤️ by John Roy L. Calimlim";
    api.sendMessage(message, event.threadID, event.messageID);
};