const googleTTS = require('google-tts-api');
const configs = require("../../configs");
const axios = require("axios");
const fs = require("fs");
let cheerio = require("cheerio");
let cheerioAdv = require("cheerio-advanced-selectors");

const openSettings = () => JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));

const isLanguageValid = async (language) => {
    let isValid = false;

    let languages = await axios.get("https://translate.google.com").then(response => {
        // Wrap cheerio
        cheerio = cheerioAdv.wrap(cheerio);
        // let $ = cheerio.load(response.data);
        // let divs = $('c-wiz > div > div:eq(1) > c-wiz > div:eq(1) > c-wiz > div:first > div:first > c-wiz > div:eq(1) > div:first > div:eq(2) > div:first > div:eq(1)');

        console.log(cheerio)
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