const fs = require("fs");
const configs = require("../../configs");

module.exports = async (matches, event, api, extras) => {
    const settingsList = JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));

    if(matches.length == 1) {
        
    }
};