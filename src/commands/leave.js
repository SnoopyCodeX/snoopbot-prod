const fs = require("fs");
const configs = require("../../configs");

module.exports = async (matches, event, api, extra) => {
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
    
        let msg = justLeft ? `🚨 SnoopBot has left the conversation! Type ${configs.DEFAULT_PREFIX}join — to add the bot back again!`
            : "🚧 SnoopBot is not in this conversation.";
            
        api.sendMessage(msg, event.threadID, event.messageID);
        stopTyping();
    });
};