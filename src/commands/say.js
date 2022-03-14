const googleTTS = require('google-tts-api');
const configs = require("../../configs");
const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");

const openSettings = () => JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));

const isLanguageValid = async (language) => {
    let isValid = false;

    let languages = await axios.get("https://translate.google.com").then(response => {
        // Wrap cheerio
        let $ = cheerio.load(response.data);
        let divs = $('body > c-wiz > div:first-child > div:nth-child(1) > c-wiz > div:nth-child(1) > c-wiz > div:first-child > div:first-child > c-wiz > div:nth-child(1) > c-wiz > div:first-child > div:first-child > div:nth-child(2) > div:first-child > div:nth-child(2) > div[tabindex=0]');

        console.log(divs)
    });

    return isValid;
};

const say = async (matches, event, api, extra) => {
    const settingsList = openSettings();
    const settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;

    const language = matches[1];
    const wordOrPhrase = matches[2];

    isLanguageValid(language);

    const url = googleTTS.getAudioUrl(wordOrPhrase, {
        lang: language,
        slow: false,
        host: 'https://translate.google.com',
    });
};

module.exports = say;