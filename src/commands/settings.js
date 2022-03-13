const fs = require("fs");
const configs = require("../../configs");

const isBool = val => {
    return val === "true" || val === "false" || val === false || val === true;
};

const stringToBoolean = val => {
    return val === "true" ? true : false;
}

const saveSettings = (settings) => {
    fs.writeFileSync(configs.APP_SETTINGS_LIST_FILE, JSON.stringify(settings, undefined, 4), {encoding: "utf8"});
}

const settings = async (matches, event, api, extras) => {
    const settingsList = JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
    const settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
    const userSetting = matches[1];
    const option = matches[2];

    if(userSetting in settings) {
        if(isBool(settings[userSetting]) && !isBool(option)) {
            api.sendMessage(`❌Invalid option for '${userSetting}', option should be of type boolean (true or false)!`, event.threadID, event.messageID);
            return;
        } else if(isBool(settings[userSetting]) && isBool(option)) {
            settingsList.threads[event.threadID][userSetting] = stringToBoolean(option);
            saveSettings(settingsList);

            api.sendMessage(`✔SnoopBot's setting for '${userSetting}' has been set to ${option}.`, event.threadID, event.messageID);
            return;
        }


        return;
    }

    api.sendMessage(`❌Unknown setting: '${userSetting}'.\n\nType '${settings.prefix}settings list' to see the list of available settings.`, event.threadID, event.messageID);
};


const list = async (matches, event, api, extras) => {
    console.log(matches);
};

module.exports = {settings, list};