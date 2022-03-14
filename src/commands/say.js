const googleTTS = require('google-tts-api');
const googleTTSLanguages = require("../utils/google-tts-languages");
const configs = require("../../configs");
const cloudscraper = require("cloudscraper");
const fs = require("fs");

const openSettings = () => JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));

const isLanguageValid = (language) => (googleTTSLanguages.find(language) !== undefined);

const say = async (matches, event, api, extra) => {
    const settingsList = openSettings();
    const settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;

    const language = matches[1];
    const wordOrPhrase = matches[2];
    
    console.log(matches);

    if(!isLanguageValid(language)) {
        api.sendMessage(`❌ Invalid language used! Type: \n\n${settings.prefix}say languages-list\n\nTo see the list of supported languages.`, event.threadID, event.messageID);
        return;
    }

    const url = googleTTS.getAudioUrl(wordOrPhrase, {
        lang: googleTTSLanguages.find(language).code,
        slow: false,
        host: 'https://translate.google.com',
    });
    const path = "./temps/say.mp3";
    const msg = {};

    if(url === undefined) {
        api.sendMessage(`❌ Failed to generate speech syntesis for the phrase/word:\n\n${wordOrPhrase}\n\nPlease try using a different language.`, event.threadID, event.messageID);
        return;
    }

    cloudscraper.get({uri: url, encoding: null})
        .then(buffer => fs.writeFileSync(path, buffer))
        .then(response => {
            msg.body = `✔ Successfully generated a speech syntesis for the phrase/word:\n\n${wordOrPhrase}`;
            msg.attachment = fs.createReadStream(path).on("end", async () => {
		        if(fs.existsSync(path)) {
			        fs.unlink(path, (err) => {
				        if(err) return console.log(err);
				
				        console.log("Deleted file: " + path);
			        });
		        }
	        });
	
	        api.sendMessage(msg, event.threadID, event.messageID);
        });
};

const list = async (matches, event, api, extra) => {
    const settingsList = openSettings();
    const settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;

    let body = "🔰 Supported TTS Languages\n\n";
    let msg = {};

    for(let language of googleTTSLanguages.list())
        body += `📄 ${language.name}\nCode: ${language.code}\n\n`;
    body += "❤ Made by @John Roy Lapida Calimlim";

    msg.body = body;
    msg.mentions = [{id: "100031810042802", tag: "@John Roy Lapida Calimlim"}];
    api.sendMessage(msg, event.threadID, event.messageID);
};

module.exports = {say, list};