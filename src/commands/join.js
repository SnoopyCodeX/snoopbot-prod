const fs = require("fs");
const configs = require("../../configs");

module.exports = async (matches, event, api, extra) => {
    let threadWhitelist = JSON.parse(fs.readFileSync(configs.APP_THREAD_WHITELIST_FILE, {encoding: "utf8"}));
    let justJoined = false;
 
    if(!threadWhitelist.threads.includes(event.threadID)) {
    	threadWhitelist.threads.push(event.threadID);
        fs.writeFileSync(configs.APP_THREAD_WHITELIST_FILE, JSON.stringify(threadWhitelist, undefined, 4), {encoding: "utf8"});
        
        justJoined = true;
    }
    
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	if(err) return console.log(err);
    
        let msg = justJoined ? `🎉 SnoopBot joined the conversation! Type ${configs.DEFAULT_PREFIX}help — to see the list of available commands!`
            : "🚧 SnoopBot is already in this conversation.";
            
        api.sendMessage(msg, event.threadID, event.messageID);
        stopTyping();
    });
};