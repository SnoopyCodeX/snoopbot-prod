module.exports = async (matches, event, api, extra) => {
    let typeStop = api.sendTypingIndicator(event.threadID, (err) => {
    	if(err) return console.error(err);
    
        api.getUserID("John Roy Lapida Calimlim", (err, data) => {
        	let message = "🗂️ SnoopBot Info 🗂️";
            message += "\n💻 Creator: @John Roy L. Calimlim";
            message += "\n🤖 Description: SnoopBot is a facebook messenger chat bot made using NodeJS, Axios and the Unofficial Facebook Chat API.";
            message += "\n\n© 2022";
            
            let messageBody = {
            	body: message,
                mentions: [{
                    tag: "@John Roy L. Calimlim",
                    id: data[0].userID
                }]
            };
            
            api.sendMessage(messageBody, event.threadID, event.messageID);
            typeStop();
        });
    });
};