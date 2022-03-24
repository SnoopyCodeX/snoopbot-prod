const fs = require("fs");
const configs = require("../../configs");
const adminUtils = require("../utils/adminUtils");

const openSettings = () => JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));

const promoteOrDemote = async (matches, event, api, extra) => {
  let settingsList = openSettings();
  let settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
  let adminWhiteList = adminUtils.getAdminsFromThread(event.threadID);
  let admins = adminWhiteList.hasError ? [] : adminWhiteList.admins;
  let action = matches[1];
  let person = matches[2];
  let mentions = event.mentions;
  
  // If admin did not mentioned any users
  if(Object.entries(mentions).length === 0) {
    api.sendMessage(
      `⚠️ You have not mentioned any users to ${action} ${action === "promote" ? "as" : "from being"} an administrator of this chatbot!`,
      event.threadID,
      event.messageID
    );
    
    return;
  }
  
  // Get user IDs of mentioned users
  let mentionedIds = [];
  for(let mentionedID in mentions)
    mentionedIds.push(mentionedID);
   
   // Promote or demote mentioner users 
  let result = undefined;
  if(action === "promote")
    result = adminUtils.addAdminsInThread(event.threadID, ...mentionedIds);
  
  if(action === "demote")
    result = adminUtils.removeAdminsInThread(event.threadID, ...mentionedIds);
    
  // If Promoting/Demoting succeeded
  if(result !== undefined && !result.hasError) {
    let message = `Successfully ${action}d `;
    let toBeMentioned = [];
    
    for(let mentionedID in mentions) {
      message += `${mentions[mentionedID]} `;
      toBeMentioned.push({
        id: mentionedID,
        tag: mentions[mentionedID],
        fromIndex: message.lastIndexOf(mentions[mentionedID])
      });
    }
    
    message += `${action === "promote" ? "as" : "from being"} an administrator of this chatbot!`;
    api.sendMessage({
      body: message,
      mentions: toBeMentioned
    }, event.threadID, event.messageID);
    
    return;
  }
  
  // If Promoting/Demoting failed
  if(result !== undefined && result.hasError) {
    let userIDs = result.alreadyAdmins || result.notAdmins;
    let message = `⚠️ ${action === "promote" ? "Promotion" : "Demotion"} failed, `;
    let toBeMentioned = [];
    
    for(let userID of userIDs) {
      message += `${mentions[userID]} `;
      toBeMentioned.push({
        id: userID,
        tag: mentions[userID],
        fromIndex: message.lastIndexOf(mentions[userID])
      });
    }
    
    let isOrAre = userIDs.length > 1 ? "are" : "is";
    let alreadyOrNot = action === "promote" ? "already" : "not";
    message += `${isOrAre} ${alreadyOrNot} an administrator of this chatbot!`;
    
    api.sendMessage({
      body: message,
      mentions: toBeMentioned
    }, event.threadID, event.messageID);
    
    return;
  }
  
  // If an unknown action is executed
  api.sendMessage(`⚠️ Unknown action: ${action}\n\nUsage: ${settings.prefix + extra.usage}`, event.threadID, event.messageID);
};

module.exports = async (matches, event, api, extra) => {
  let settingsList = openSettings();
  let settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
  let adminWhiteList = adminUtils.getAdminsFromThread(event.threadID);
  let admins = adminWhiteList.hasError ? [] : adminWhiteList.admins;
  let action = matches[1];
  let person = matches[2];
  let mentions = event.mentions;
 
  console.log(admins)
 
  // Promoting / Demoting user by replying to his/her message 
  // the command: /admin (promote|demote) @you
  if(event.type === "message_reply" && (action === "promote" || action === "demote")) {
    let userReplyID = event.messageReply.senderID;
    let botID = await api.getCurrentUserID();
    let user = (await api.getUserInfo(userReplyID))[userReplyID];
    
    console.log(matches)
    
    // If admin wants to demote or promote bot owner or the bot itself
    if(userReplyID === botID || userReplyID === adminWhiteList.botOwner) {
      api.sendMessage({
        body: `⚠️ You are not allowed to demote or promote @${user.name}!`,
        mentions: [{
          id: userReplyID,
          tag: `@${user.name}`
        }]
      }, event.threadID, event.messageID);
      
      return;
    }
    
    // If admin did not specifically typed @you
    if(person !== "@you") {
      api.sendMessage({
        body: `⚠️ To ${action} @${user.name} ${action === "promote" ? "to" : "from being"} an administrator of this chatbot, please reply this command:\n\n${settings.prefix}admin ${action} @you\n\n—to ${user.gender === 2 ? "his" : "her"} message.`,
        mentions: [{
          id: userReplyID,
          tag: `@${user.name}`
        }]
      }, event.threadID, event.messageID);
      
      return;
    }
    
    // If user to promote is already an admin
    if(admins.includes(userReplyID) && action === "promote") {
      api.sendMessage({
        body: `⚠️ Promotion failed, @${user.name} is already an administrator of this chatbot!`,
        mentions: [{
          id: userReplyID,
          tag: `@${user.name}`
        }]
      }, event.threadID, event.messageID);
      
      return;
    }
    
    // If user to demote is not an admin
    if(!admins.includes(userReplyID) && action === "demote") {
      api.sendMessage({
        body: `⚠️ Demotion failed, @${user.name} is not an administrator of this chatbot!`,
        mentions: [{
          id: userReplyID,
          tag: `@${user.name}`
        }]
      }, event.threadID, event.messageID);
      
      return;
    }
    
    // If action is to promote user
    if(action === "promote")
      adminUtils.addAdminsInThread(event.threadID, userReplyID);
    
    // If action is to demote user
    if(action === "demote")
      adminUtils.removeAdminsInThread(event.threadID, userReplyID);
      
    api.sendMessage({
      body: `@${user.name} has been ${action}d ${action === "promote" ? `as` : `from being`} an administrator of this chatbot!`,
      mentions: [{
        id: userReplyID,
        tag: `@${user.name}`
      }]
    }, event.threadID, event.messageID);
    
    return;
  }
 
  // If action is to list all admins in the thread
  if(action === "list") {
    if(person !== undefined) {
      api.sendMessage("⚠️ You do not need to specify any users when using this command!", event.threadID, event.messageID);
      return;
    }
  
    if(adminWhiteList.hasError) {
      api.sendMessage(`⚠️ ${adminWhiteList.message}`, event.threadID, event.messageID);
      return;
    }
    
    let message = "Current administrators:\n\n";
    let adminInfos = await api.getUserInfo(admins);
    let mentions = [];
    
    for(let admin in adminInfos) {
      let userInfo = adminInfos[admin];
      message += `@${userInfo.name}\n`;
      
      mentions.push({
        id: admin,
        tag: `@${userInfo.name}`,
        fromIndex: message.lastIndexOf(`@${userInfo.name}`)
      });
    }
    
    api.sendMessage({
      body: message,
      mentions
    }, event.threadID, event.messageID);
    
    return;
  }
  
  promoteOrDemote(matches, event, api, extra);
};