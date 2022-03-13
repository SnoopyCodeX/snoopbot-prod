const fs = require("fs");
const configs = require("../../configs");

const toOrdinalNumber = (number) => {
    let _strNumber = `${number}`;
    let _lastNumber = _strNumber.split("")[_strNumber.length - 1];

    switch(_lastNumber) {
        case "1":
            _strNumber += "st";
        break;

        case "2":
            _strNumber += "nd";
        break;

        case "3":
            _strNumber += "rd";
        break;

        default:
            _strNumber += "th";
        break;
    }

    return _strNumber;
};

const saveSettings = (settings) => {
    fs.writeFileSync(configs.APP_SETTINGS_LIST_FILE, JSON.stringify(settings, undefined, 4), {encoding: "utf8"});
}

const openSettings = () => {
    return JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
}

module.exports = (next) => {
	return async (event, api) => {
		if(event.type === "event") {
            switch(event.logMessageType) {
                case "log:subscribe": // Someone joined the gc
                    // Get thread info
                    const thread1 = await api.getThreadInfo(event.threadID);

                    // Check if this thread is a Group (more than 2 members)
                    // Ignore this thread if this is not a group
                    if(!thread1.isGroup)
                        return;

                    // Get settings for this specific thread
                    let settingsList = openSettings();
                    if(settingsList.threads[event.threadID] === undefined)
                        settingsList.threads[event.threadID] = settingsList.defaultSettings;
                    
                    saveSettings(settingsList);
                    let settings = settingsList.threads[event.threadID];
                    
                    let threadName = thread1.threadName;
                    let participants = thread1.userInfo;
                    let addedParticipants = event.logMessageData.addedParticipants;
                    let botID = await api.getCurrentUserID();
                    let message = {mentions: [], body: ""};

                    // Loop through all added participants
                    for(let newParticipant of addedParticipants) {
                        // If the added participant is the bot itself, just send a greeting message then break this loop.
                        if(newParticipant.userFbId == botID) {
                            message.body = `Hi, I am SnoopBot. Thank you for having me as the ${toOrdinalNumber(participants.length)} member of "${threadName}".\n\n`;
                            message.body += `Type ${settings.prefix}help to see the list  of available commands. Please remember to not spam the bot to avoid the bot from being muted by fb. Thank you for your kind understanding! <3\n\n~Author: @John Roy Lapida Calimlim`;
                            message.mentions.push({tag: "@John Roy Lapida Calimlim", id: "100031810042802"});

                            // Set bot's nickname
                            api.changeNickname("SnoopBot", event.threadID, botID, (err) => {
                                if(err) return console.error(err);
                            });
                            break;
                        }

                        // Don't greet if auto greet is disabled in this thread's settings
                        if(!settings.autoGreetEnabled)
                            return;

                        let firstName = newParticipant.firstName;
                        let id = newParticipant.userFbId;
                        message.body = `Welcome @${firstName}, you are the ${toOrdinalNumber(participants.length)} member of "${threadName}"!\n\nWe hope that we'll know about you better and we'd have a great friendship ahead.`;
                        message.mentions.push({id, tag: `@${firstName}`});
                    }

                    api.sendMessage(message, event.threadID);
                break;

                case "log:unsubscribe": // Someone left the gc
                    // Get thread info
                    const thread2 = await api.getThreadInfo(event.threadID);

                    // Check if this thread is a Group (more than 2 members)
                    // Ignore this thread if this is not a group
                    if(!thread2.isGroup)
                        return;

                    // Get settings for this specific thread
                    let settingsList = openSettings();
                    if(settingsList.threads[event.threadID] === undefined)
                        settingsList.threads[event.threadID] = settingsList.defaultSettings;
                    
                    saveSettings(settingsList);
                    let settings = settingsList.threads[event.threadID];
                    
                    let threadName = thread2.threadName;
                    let participants = thread2.userInfo;
                    let addedParticipants = event.logMessageData.addedParticipants;
                    let botID = await api.getCurrentUserID();
                    let message = {mentions: [], body: ""};

                    // Loop through all added participants
                    for(let newParticipant of addedParticipants) {
                        // If the participant that left is the bot itself, ignore
                        if(newParticipant.userFbId == botID) 
                            break;

                        // Don't greet if auto greet is disabled in this thread's settings
                        if(!settings.autoGreetEnabled)
                            return;

                        let firstName = newParticipant.firstName;
                        let id = newParticipant.userFbId;
                        message.body = `Farewell @${firstName}, the whole ${threadName} will be awaiting for your return!\n\nGoodbye for now and may you have a blessed day ahead! <3`;
                        message.mentions.push({id, tag: `@${firstName}`});
                    }

                    api.sendMessage(message, event.threadID);
                break;
            }
        }
        
        await next(event, api);
	};
};