const fs = require("fs");
const configs = require("../../configs");

const openSettings = () => {
    return JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
}

module.exports = async (matches, event, api, extra) => {
    let settingsList = openSettings();
    let settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;

    let threadWhitelist = JSON.parse(fs.readFileSync(configs.APP_THREAD_WHITELIST_FILE, {encoding: "utf8"}));
    let justJoined = false;
 
    if(!threadWhitelist.threads.includes(event.threadID)) {
    	threadWhitelist.threads.push(event.threadID);
        fs.writeFileSync(configs.APP_THREAD_WHITELIST_FILE, JSON.stringify(threadWhitelist, undefined, 4), {encoding: "utf8"});
        
        justJoined = true;
    }
    
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	if(err) return console.log(err);
    
        let msg = justJoined ? `🎉 SnoopBot joined the conversation!\nType ${settings.prefix}help — to see the list of available commands!`
            : "🚧 SnoopBot is already in this conversation.";
            
        api.sendMessage(msg, event.threadID, event.messageID);
        stopTyping();
    });
};