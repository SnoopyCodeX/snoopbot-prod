const fs = require("fs");
const configs = require("../../configs");

const openSettings = () => {
    return JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
}

module.exports = async (matches, event, api, extra) => {
    let settingsList = openSettings();
    let settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;

    let threadWhitelist = JSON.parse(fs.readFileSync(configs.APP_THREAD_WHITELIST_FILE, {encoding: "utf8"}));
    let justLeft = false;
 
    if(threadWhitelist.threads.includes(event.threadID)) {
    	let tempThreads = [];
    
        for(let threadID of threadWhitelist.threads) {
        	if(event.threadID !== threadID)
                tempThreads.push(threadID);
        }
    
        threadWhitelist.threads = tempThreads;
        fs.writeFileSync(configs.APP_THREAD_WHITELIST_FILE, JSON.stringify(threadWhitelist, undefined, 4), {encoding: "utf8"});
        
        justLeft = true;
    }
    
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	if(err) return console.log(err);
    
        let msg = justLeft ? `🚨 SnoopBot has left the conversation!\nType ${settings.prefix}join — to add the bot back again!`
            : "🚧 SnoopBot is not in this conversation.";
            
        api.sendMessage(msg, event.threadID, event.messageID);
        stopTyping();
    });
};