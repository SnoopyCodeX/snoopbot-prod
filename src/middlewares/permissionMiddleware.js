const fs = require("fs");
const configs = require("../../configs")
const adminUtils = require("../utils/adminUtils");
const permissionUtil = require("../utils/permissionUtils");

const permissionMiddleware = (next) => {
  return async (matches, event, api, extra) => {
    if (matches.length == 0) return;

    let adminWhitelist = adminUtils.getAdminsFromThread(event.threadID);
    let admins = adminWhitelist.hasError ? [] : adminWhitelist.admins;
    let command = matches[0].split(" ")[0];

    if (!permissionUtil.userHasPermission(event.threadID, event.senderID, command)) {
      let message = "⚠️ You do not have permission to use this command.";
      api.sendMessage(message, event.threadID, event.messageID);

      return;
    }
    
    if((!admins.includes(event.senderID) && (event.senderID !== adminWhitelist.botOwner)) && extra.adminOnly) {
      let message = "⚠️ This command is for administrators only!";
      api.sendMessage(message, event.threadID, event.messageID);
      
      return;
    }

    await next(matches, event, api, extra);
  };
};

module.exports = permissionMiddleware;