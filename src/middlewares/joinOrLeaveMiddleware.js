const fs = require("fs");
const configs = require("../../configs");
const adminUtils = require("../utils/adminUtils");

module.exports = (next) => {
  return async (matches, event, api, extra) => {
    let threadWhitelist = JSON.parse(fs.readFileSync(configs.APP_THREAD_WHITELIST_FILE, {
      encoding: "utf8"
    }));
    
    let adminWhitelist = adminUtils.getAdminsFromThread(event.threadID);
    let botOwner = adminWhitelist.botOwner;
    let admins = adminWhitelist.hasError ? [] : adminWhitelist.admins;

    let botID = await api.getCurrentUserID();
    if (!threadWhitelist.threads.includes(event.threadID) && ((event.senderID !== botID) && (botOwner !== event.senderID) && !admins.includes(event.senderID)))
      return false;

    await next(matches, event, api, extra);
  };
};