const fs = require("fs");
const cloudscraper = require("cloudscraper");
const configs = require("../../configs");

const openSettings = () => JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
const openPinnedMessages = () => JSON.parse(fs.readFileSync(configs.APP_PINNED_MESSAGES_FILE, {encoding: "utf8"}));
const savePinnedMessages = (pinnedMessages) => fs.writeFileSync(
  configs.APP_PINNED_MESSAGES_FILE,
  JSON.stringify(pinnedMessages, null, 4),
  {encoding: "utf8"}
);

const getExt = (filetype) => {
  return filetype === "photo" ? ".jpg" :
	  filetype === "audio" ? ".mp3" :
	  filetype === "animated_image" ? ".gif" :
	  filetype === "video" ? ".mp4" : "";
};

const addPin = async (threadID, name, content) => {
  let allPinnedMessages = openPinnedMessages();
  let pinnedMessages = allPinnedMessages.threads[threadID] || {};
  
  // Check if name already exist
  if(name in pinnedMessages)
    return {
      message: `An existing pinned message with the name "${name}" is already in the pinned messages, please choose another name.`,
      hasError: true
    };
  
  let attachmentTypes = "";
  let attachments = [];
  
  if(content.attachments.length > 0) {
    let counter = 0;
    
    for(let attachment of content.attachments) {
      // Ignore shared attachments and locations (for now)
      if(attachment.type === "share" || attachment.type === "location")
        continue;
      
      let path = `./pinned_attachments/${name}-${counter}-${attachment.filename}`;
      
      // If attachment is a sticker.
      if(attachment.type === "sticker") {
        attachments.push({type: "sticker", stickerID: attachment.stickerID});
         
        if(attachmentTypes.includes("sticker,"))
          attachmentTypes = attachmentTypes.replace(/\b(sticker)\b/, "stickers");
        
        if(!attachmentTypes.includes("stickers"))
          attachmentTypes += "sticker, ";
        
        continue;
      }
      
      let hasError = false;
      let url = attachment.type !== "photo" ? attachment.url : attachment.largePreviewUrl;
      let ext = getExt(attachment.type);
      path += ext;
      
      // Download and save locally
      await cloudscraper.get({uri: url, encoding: null})
        .then((buffer) => fs.writeFileSync(path, buffer))
        .catch((error) => {
          console.log(error);
          hasError = true;
        });
      
      // Skip if an error occured while downloading attachment
      if(hasError)
        continue;
      
      if(attachmentTypes.includes(attachment.type + ","))
        attachmentTypes = attachmentTypes.replace(`${attachment.type}`, attachment.type + "s");
      
      if(!attachmentTypes.includes(attachment.type + "s"))
        attachmentTypes += `${attachment.type}, `;
        
      attachments.push({type: attachment.type, path});
      counter += 1;
    }
    
    attachmentTypes = attachmentTypes.substring(0, attachmentTypes.length - 2);
  }
  
  if(allPinnedMessages.threads[threadID] === undefined)
    allPinnedMessages.threads[threadID] = {};
  
  allPinnedMessages.threads[threadID][name] = {
    sender: content.sender,
    body: content.body,
    attachments,
    attachmentTypes: attachmentTypes.length === 0 ? "None" : attachmentTypes
  };
  
  savePinnedMessages(allPinnedMessages);
  return {hasError: false};
};

const getPin = async (threadID, name) => {
  let allPinnedMessages = openPinnedMessages();
  let pinnedMessages = allPinnedMessages.threads[threadID] || {};
  
  if(Object.entries(pinnedMessages).length === 0)
    return {
      message: "This thread has no pinned messages to retrieve",
      hasError: true
    };
    
  if(!(name in pinnedMessages))
    return {
      message: `There's no pinned message in this thread with the name, "${name}".`,
      hasError: true
    };
    
  let body = `${pinnedMessages[name].body}\n\nSent by: @${pinnedMessages[name].sender.name}`;
  let mentions = [{
    id: pinnedMessages[name].sender.id,
    tag: `@${pinnedMessages[name].sender.name}`
  }];
  let attachments = pinnedMessages[name].attachments;
  let streams = [];
  let msg = {body, mentions};
  
  for(let attachment of attachments) {
    if(attachment.type === "sticker") {
      msg.sticker = attachment.stickerID;
      continue;
    }
    
    streams.push(fs.createReadStream(attachment.path));
  }
  
  if(streams.length > 0)
    msg.attachment = streams;
    
  return {
    msg, hasError: false
  };
};

const removePin = async (threadID, name) => {
  let allPinnedMessages = openPinnedMessages();
  let pinnedMessages = allPinnedMessages.threads[threadID] || {};
  
  if(Object.entries(pinnedMessages).length === 0)
    return {
      message: "This thread has no pinned messages to remove", 
      hasError: true
    };
    
  if(name === "all") {
    // Delete ALL the locally saved attachments 
    for(let name in pinnedMessages) {
      for(let attachment of pinnedMessages[name].attachments) {
        if(attachment.type === "sticker")
          continue;
      
        if(fs.existsSync(attachment.path)) {
          fs.unlink(attachment.path, (err) => {
            if(err) return console.log(err);
          
            console.log(`Deleted file: ${attachment.path}!`)
          });
        }
      }
    }
    
    delete allPinnedMessages.threads[threadID];
    savePinnedMessages(allPinnedMessages);
    
    return {hasError: false};
  }
    
  if(!(name in pinnedMessages))
    return {
      message: `There's no pinned message in this thread with the name, "${name}".`,
      hasError: true
    };
 
  // Delete the locally saved attachments 
  for(let attachment of pinnedMessages[name].attachments) {
    if(attachment.type === "sticker")
      continue;
    
    if(fs.existsSync(attachment.path)) {
      fs.unlink(attachment.path, (err) => {
        if(err) return console.log(err);
        
        console.log(`Deleted file: ${attachment.path}!`)
      });
    }
  }
    
  delete allPinnedMessages.threads[threadID][name];
  
  if(Object.entries(allPinnedMessages.threads[threadID]).length === 0)
    delete allPinnedMessages.threads[threadID];
    
  savePinnedMessages(allPinnedMessages);
  return {hasError: false};
};

const listPin = async (threadID) => {
  let allPinnedMessages = openPinnedMessages();
  let pinnedMessages = allPinnedMessages.threads[threadID] || {};
  
  if(Object.entries(pinnedMessages).length === 0)
    return {
      message: "This thread has no pinned messages to list", 
      hasError: true
    };
  
  let list = "--------------------\n";
  let length = Object.entries(pinnedMessages).length;
  let mentions = [];
  for(let pinnedMsg in pinnedMessages) {
    list += `Name: ${pinnedMsg}\n`;
    
    if(pinnedMessages[pinnedMsg].body.length > 0)
      list += `Message:\n\n ${pinnedMessages[pinnedMsg].body}\n`;
    
    list += `\nSent by: @${pinnedMessages[pinnedMsg].sender.name}\nAttachments: ${pinnedMessages[pinnedMsg].attachmentTypes}\n--------------------\n\n`;
    
    mentions.push({
      id: pinnedMessages[pinnedMsg].sender.id,
      tag: `@${pinnedMessages[pinnedMsg].sender.name}`,
      fromIndex: list.lastIndexOf(`@${pinnedMessages[pinnedMsg].sender.name}`)
    });
  }
  list = list.substring(0, list.length - 4);
  
  return {list, length, mentions, hasError: false};
};

const pin = async (matches, event, api, extra) => {
  let settingsList = openSettings();
  let settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
  let action = matches[1]; // add | get | remove | list
  let name = matches[2]; // <name of pinned message> | undefined
  
  if(event.type === "message_reply" && action !== "add") {
    api.sendMessage(`⚠️ You do not need to reply this command's action to a message!`, event.threadID, event.messageID);
    return;
  }
  
  switch(action) {
    case "add":
      if(event.type !== "message_reply") {
        api.sendMessage(`⚠️ You must reply this command to a message in a thread!`, event.threadID, event.messageID);
        return;
      }
      
      let body = event.messageReply.body || "";
      let attachments = event.messageReply.attachments;
      let senderInfo = await api.getUserInfo(event.messageReply.senderID);
      senderInfo = senderInfo[event.messageReply.senderID];
      console.log(senderInfo);
      let sender = {id: event.messageReply.senderID, name: senderInfo.name};
      
      if(name === undefined) {
        api.sendMessage("⚠️ Please specify a name for your pin", event.threadID, event.messageID);
        return;
      }
      
      if(name.toLowerCase() === "all") {
        api.sendMessage("⚠️ The name \"all\" is a reserved keyword for this command, please use another name.", event.threadID, event.messageID);
        return;
      }
      
      let result = await addPin(event.threadID, name, {body, attachments, sender});
      
      if(result.hasError) {
        api.sendMessage(`⚠️ ${result.message}`, event.threadID, event.messageID);
        return;
      }
      
      api.sendMessage(`📌 Added new pinned message with the name, "${name}".\n\nType ${settings.prefix}pin get ${name} — to retrieve it or,\n\nType ${settings.prefix}pin remove ${name} — to remove it from this thread's pinned messages.`, event.threadID, event.messageID);
    break;
    
    case "get":
      if(name === undefined) {
        api.sendMessage("⚠️ Please specify a name for your pin", event.threadID, event.messageID);
        return;
      }
      
      let pinned = await getPin(event.threadID, name);
      
      if(pinned.hasError) {
        api.sendMessage(`⚠️ ${pinned.message}`, event.threadID, event.messageID);
        return;
      }
      
      api.sendMessage(pinned.msg, event.threadID, event.messageID);
    break;
    
    case "remove":
    case "purge":
      if(name === undefined) {
        api.sendMessage("⚠️ Please specify the name of the pinned message that you want to remove", event.threadID, event.messageID);
        return;
      }
      
      let removed = await removePin(event.threadID, name);
      
      if(removed.hasError) {
        api.sendMessage(`⚠️ ${action === "purge" ? removed.message.replace("remove", "purge") : removed.message}`, event.threadID, event.messageID);
        return;
      }
      
      api.sendMessage(`🗑 Successfully ${action === "purge" ? "purged" : "removed"} ${name.toLowerCase() === "all" ? "all pinned messages of this thread!" : `"${name}" from this thread's pinned messages!`}`, event.threadID, event.messageID);
    break;
    
    case "list":
      if(name !== undefined) {
        api.sendMessage(`⚠️ Incorrect use of command: ${settings.prefix}pin list\n\nYou don't need to specify the <name> argument when using this specific command.`, event.threadID, event.messageID);
        return;
      }
      
      let list = await listPin(event.threadID);
      
      if(list.hasError) {
        api.sendMessage(`⚠️ ${list.message}`, event.threadID, event.messageID);
        return;
      }
      
      let thread = await api.getThreadInfo(event.threadID);
      let msg = `📌 There ${list.length > 1 ? "are" : "is only"} ${list.length} pinned message${list.length > 1 ? "s" : ""} in ${thread.threadName}\n${list.list}`;
      api.sendMessage({body: msg, mentions: list.mentions}, event.threadID, event.messageID);
    break;
  }
};

module.exports = async (matches, event, api, extra) => {
  extra.global.pinMessageQueue.enqueue(async () => {
    await pin(matches, event, api, extra);
  });
};