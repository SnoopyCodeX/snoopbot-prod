const fs = require("fs");
const configs = require("../../configs");

const settings = async (matches, event, api, extras) => {
    const settingsList = JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
    const settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
    const userSetting = matches[1];
    const option = matches[2];

    console.log(settings);
};


const list = async (matches, event, api, extras) => {
    console.log(matches);
};

module.exports = {settings, list};