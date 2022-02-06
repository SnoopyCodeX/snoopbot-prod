const permissionUtils = require("../utils/permissionUtils");

const _grant = (event, api, extra, command, persons) => {
	let mentions = [];
	let names = "";
	
	// Check if command exists
    const hasCommand = extra.commands.some(c => command.includes(c.name));
    if(!hasCommand) {
    	let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	    if(err) return console.log(err);
    
            api.sendMessage(" Unknown command(s): '" + command.join(", ") + "'.", event.threadID, event.messageID);
            stopTyping();
        });
        
        return;
    }
    
    // Grant permissions to all mentioned users
    for(let key in persons) {
    	permissionUtils.grant(event.threadID, key, ...command);
    
        names += persons[key] + " ";
        mentions.push({ id: key, tag: persons[key] });
    }
    names = names.substring(0, names.length - 1);
    
    let message = {
    	body: "🤖 Gave permission to: \n\n" + names + "\n\nFor command(s): \n\n'" + command.join(", ") + "'.",
        mentions
    };
    
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	if(err) return console.log(err);
    
        api.sendMessage(message, event.threadID, event.messageID);
        stopTyping();
    });
}

const _revoke = (event, api, extra, command, persons) => {
	let mentions = [];
	let names = "";
	
	// Check if command exists
    const hasCommand = extra.commands.some(c => command.includes(c.name));
    if(!hasCommand) {
    	let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	    if(err) return console.log(err);
    
            api.sendMessage(" Unknown command(s): '" + command.join(", ") + "'.", event.threadID, event.messageID);
            stopTyping();
        });
        
        return;
    }
    
    // Grant permissions to all mentioned users
    for(let key in persons) {
    	permissionUtils.revoke(event.threadID, key, ...command);
    
        names += persons[key] + " ";
        mentions.push({ id: key, tag: persons[key] });
    }
    names = names.substring(0, names.length - 1);
    
    let message = {
    	body: "🤖 Revoked permission to: \n\n" + names + "\n\nFor command(s): \n\n'" + command.join(", ") + "'.",
        mentions
    };
    
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	if(err) return console.log(err);
    
        api.sendMessage(message, event.threadID, event.messageID);
        stopTyping();
    });
}

const _list = (event, api, extra, command, persons) => {
	let mentions = [];
	let names = "";
	
	// Check if command exists
    const hasCommand = extra.commands.some(c => command.includes(c.name));
    if(!hasCommand) {
    	let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	    if(err) return console.log(err);
    
            api.sendMessage(" Unknown command(s): '" + command.join(", ") + "'.", event.threadID, event.messageID);
            stopTyping();
        });
        
        return;
    }
    
    // List all granted permissions from all mentioned users
    for(let key in persons) {
    	let userCommands = permissionUtils.list(event.threadID, key);
    
        names += persons[key] + " ";
        mentions.push({ id: key, tag: persons[key] });
    }
    names = names.substring(0, names.length - 1);
    
    let message = {
    	body: "🤖 Revoked permission to: \n\n" + names + "\n\nFor command(s): \n\n'" + command.join(", ") + "'.",
        mentions
    };
    
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    	if(err) return console.log(err);
    
        api.sendMessage(message, event.threadID, event.messageID);
        stopTyping();
    });
};

const grant = async (matches, event, api, extra) => {
    let command = matches[1].split(", ");
    let persons = event.mentions;
    
    console.log(matches);
    
    if(command[0] === "all")
    	command = extra.commands.map((c) => c.name);
    
    // If no mentions
    if(Object.entries(persons).length === 0) {
    	// If no @all
    	if(matches[0].indexOf("@all") === -1) {
    	    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
                if(err) return console.log(err);
                
                api.sendMessage(" No person is being granted permission(s), please type @all or @person.", event.threadID, event.messageID);
                stopTyping();
            });
            return;
        }
        
        // Get all participants of a threadID
        api.getThreadInfo(event.threadID, (err, info) => {
        	if(err) return console.log(err);
        
            // Store all participants id and name to 'persons'
            let participantIDs = info.participantIDs;
            participantIDs.forEach((participantID) => {
            	let userInfo = {};
            
                for(let uinfo of info.userInfo)
                    if(uinfo.id === participantID) {
                    	userInfo = uinfo;
                        break;
                    }
            
            	persons[userInfo.id] = `@${userInfo.name}`;
            });
            
            _grant(event, api, extra, command, persons);
        });
        
        return;
    }
    
    _grant(event, api, extra, command, persons);
};

const revoke = async (matches, event, api, extra) => {
    let command = matches[1].split(", ");
    let persons = event.mentions;
    
    console.log(matches);
    
    if(command[0] === "all")
    	command = extra.commands.map((c) => c.name);
    
    console.log(command);
    
    // If no mentions
    if(Object.entries(persons).length === 0) {
    	// If no @all
    	if(matches[0].indexOf("@all") === -1) {
    	    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
                if(err) return console.log(err);
                
                api.sendMessage(" No person is being revoked of permission(s), please type @all or @person.", event.threadID, event.messageID);
                stopTyping();
            });
            return;
        }
        
        // Get all participants of a threadID
        api.getThreadInfo(event.threadID, (err, info) => {
        	if(err) return console.log(err);
        
            // Store all participants id and name to 'persons'
            let participantIDs = info.participantIDs;
            participantIDs.forEach((participantID) => {
            	let userInfo = {};
            
                for(let uinfo of info.userInfo)
                    if(uinfo.id === participantID) {
                    	userInfo = uinfo;
                        break;
                    }
            
            	persons[userInfo.id] = `@${userInfo.name}`;
            });
            
            _revoke(event, api, extra, command, persons);
        });
        
        return;
    }
    
    _revoke(event, api, extra, command, persons);
};

const list = async (matches, event, api, extra) => {
	let command = matches[1].split(", ");
    let persons = event.mentions;
    
    console.log(matches);
    
    if(command[0] === "all")
    	command = extra.commands.map((c) => c.name);
    
    console.log(command);
    
    // If no mentions
    if(Object.entries(persons).length === 0) {
    	// If no @all
    	if(matches[0].indexOf("@all") === -1) {
    	    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
                if(err) return console.log(err);
                
                api.sendMessage(" No person is being checked for permission(s), please type @all or @person.", event.threadID, event.messageID);
                stopTyping();
            });
            return;
        }
        
        // Get all participants of a threadID
        api.getThreadInfo(event.threadID, (err, info) => {
        	if(err) return console.log(err);
        
            // Store all participants id and name to 'persons'
            let participantIDs = info.participantIDs;
            participantIDs.forEach((participantID) => {
            	let userInfo = {};
            
                for(let uinfo of info.userInfo)
                    if(uinfo.id === participantID) {
                    	userInfo = uinfo;
                        break;
                    }
            
            	persons[userInfo.id] = `@${userInfo.name}`;
            });
            
            _list(event, api, extra, command, persons);
        });
        
        return;
    }
    
    _list(event, api, extra, command, persons);
};

module.exports = {
	grant,
	revoke,
	list
};