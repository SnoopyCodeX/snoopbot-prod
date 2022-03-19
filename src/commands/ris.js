const configs = require("../../configs");
const axios = require("axios");
const FormData = require("form-data");
const cloudscraper = require("cloudscraper");
const fs = require("fs");

const openSettings = () => {
  return JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
}

const performRIS = async (matches, event, url) => {
  let type = event.type;
  let name = "search-query";
  
  if(type === "message_reply") {
    let messageReply = event.messageReply;
    let attachments = messageReply.attachments;
    
    // If replied message has no attachment
    if(attachments.length === 0)
      return {
        message: `⚠️ Please reply this command to an image!`,
        hasError: true
      };
    
    // If replied message has more than 1 attached image
    if(attachments.length > 1)
      return {
        message: `⚠️ Please reply this command to a message with only 1 attached image!`,
        hasError: true
      };
      
    // If replied message is not a photo
    if(attachments[0].type !== "photo")
      return {
        message: `⚠️ Please reply ONLY to an IMAGE!`,
        hasError: true
      };
    
    url = attachments[0].largePreviewUrl;
    name = attachments[0].name;
  }
  
  let form = new FormData();
  let path = `./temps/${name}.jpg`;
  await cloudscraper.get({uri: url, encoding: null})
    .then((buffer) => fs.writeFileSync(path, buffer));
    
  form.append("token", "demo");
  form.append("image", fs.createReadStream(path).on("end", async () => {
    if(fs.existsSync(path)) {
      fs.unlink(path, (err) => {
        if(err) return console.log(err);
        
        console.log(`Deleted file: ${path}`);
      })
    }
  }));
  
  return (await axios({
    method: "POST",
    url: "https://hermes-search.jersoncarin.dev/search",
    data: form,
    headers: form.getHeaders()
  }).then((response) => response.data));
};

module.exports = async (matches, event, api, extra) => {
  let settingsList = openSettings();
  let settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
  let url = matches[1];
  
  // Sent {/ris <image url>} while replying to an image
  if(url !== undefined && event.type === "message_reply") {
    api.sendMessage(`⚠️ Invalid use of command:\n\n${settings.prefix}ris\n\nUsage: ${settings.prefix + extra.usage}\n\nYou do not need to specify the image url if you reply this command to an image.`, event.threadID, event.messageID);
    return;
  }
  
  // Sent {/ris} without replying to an image
  if(url === undefined && event.type !== "message_reply") {
    api.sendMessage(`⚠️ Invalid use of command:\n\n${settings.prefix}ris\n\nUsage: ${settings.prefix + extra.usage}\n\nYou need to specify the image url if you don't reply this command to an image.`, event.threadID, event.messageID);
    return;
  }
  
  // Perform reverse image search
  let results = await performRIS(matches, event, url);
  
  // Check if results is not undefined
  if(results !== undefined) {
    // If there's an error
    if(results.hasError) {
      api.sendMessage(results.message, event.threadID, event.messageID);
      return;
    }
    
    // If results array does not have result
    if(results.results.results.length === 0) {
      api.sendMessage(`⚠️ Your reverse image search did not returned any result.`, event.threadID, event.messageID);
      return;
    }
    
    // Get search results
    let searchResults = results.results.results;
    let totalLength = searchResults.length;
    let minLength = totalLength > 5 ? 5 : totalLength;
    let counter = 1;
    let msg = {
      body: `\n--------------------\nReverse Image Search Result\n\nTotal found: ${totalLength}\nOnly showing: ${minLength}\n\n--------------------\n\n`
    };
    
    console.log(searchResults);
    
    for(let result of searchResults) {
      if(counter++ > minLength)
        break;
      
      let str = `Title: ${result.title}\n\n`;
      str += `Description:\n\n${result.description}\n\n`;
      str += `Link: ${result.url}\n\n`
      str += "--------------------\n\n";
      msg.body += str;
    };
    
    msg.body += "© Jerson Carin";
    api.sendMessage(msg, event.threadID, event.messageID);
  } else 
    api.sendMessage(`⚠️ Your reverse image search did not returned any result.`, event.threadID, event.messageID);
};