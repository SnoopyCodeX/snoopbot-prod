const fs = require("fs");
const configs = require("../../configs");

module.exports = async (matches, event, api, extras) => {
    const settingsList = JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
    const settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;

    console.log(matches);

    // if user wants to list all the settings of this thread
    if(matches.length == 1) {
        
    }
};