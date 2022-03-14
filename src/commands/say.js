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
        let divs = $('c-wiz > div > div:nth-child(1) > c-wiz > div:nth-child(1) > c-wiz > div:nth-child(0) > div:nth-child(0) > c-wiz > div:nth-child(1) > div:nth-child(0) > div:nth-child(2) > div:nth-child(0) > div:nth-child(1)');

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