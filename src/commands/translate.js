const google = require("googlethis");
const configs = require("../../configs");

const translate = async (from, to) => {
	let options = {
		page: 0,
		safe: false,
		additional_params: {
			hl: "en"
		}
	};
	
	return await google.search(`translate ${from} to ${to}`, options);
};

const openSettings = () => {
  return JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
}

module.exports = async (matches, event, api, extra) => {
	let settingsList = openSettings();
  let settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;

	let from = matches[1];
	let to = matches[2];
	
	if(to === undefined || from === undefined) {
		let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
			if(err) return console.log(err);
			
			api.sendMessage(`⚠️ Invalid usage of command: '${settings.prefix}translate'\n\nUsage: ${extra.usage}`, event.threadID, event.messageID);
			stopTyping();
		});
		
		return;
	}
	
	let response = await translate(from, to);
	let translation = response.translation;
	
	console.log(response);
	
	if(translation === undefined || Object.entries(translation).length === 0) {
		let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
			if(err) return console.log(err);
			
			api.sendMessage(`⚠️ Failed to translate the phrase:\n '${from}'\n\n to: '${to}'.`, event.threadID, event.messageID);
			stopTyping();
		});
		
		return;
	}
	
	let msg = `🧾 Google Translate Result\n\n`;
	msg += `> In ${translation.source_language.split(" ")[0]}: \n\n`;
	msg += `"${translation.source_text}"\n\n`;
	msg += `> In ${translation.target_language}:\n\n`;
	msg += `"${translation.target_text}"\n\n`;
	msg += `© Google Translate API`;
	
	let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
		if(err) return console.log(err);
			
		api.sendMessage(msg, event.threadID, event.messageID);
		stopTyping();
	});
};