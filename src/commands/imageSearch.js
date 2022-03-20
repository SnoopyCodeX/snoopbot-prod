const google = require("googlethis");
const cloudscraper = require("cloudscraper");
const fs = require("fs")
const configs = require("../../configs");
const global = require("../../global")

const openSettings = () => {
  return JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {encoding: "utf8"}));
}

const imageSearch = async (matches, event, api, extra) => {
  let settingsList = openSettings();
  let settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
  let query = matches[1];
  
  api.sendMessage("🔎 Searching image...", event.threadID, event.messageID);
  
  let result = await google.image(query, {safe: false});
  if(result.length === 0) {
    api.sendMessage(`⚠️ Your image search did not return any result.`, event.threadID, event.messageID)
    return;
  }
  
  let streams = [];
  let counter = 0;
  
  console.log(result)
  
  for(let image of result) {
    // Only show 6 images
    if(counter >= 6)
      break;
      
    console.log(`${counter}: ${image.url}`);
    
    // Ignore urls that does not ends with .jpg or .png
    let url = image.url;
    if(!url.endsWith(".jpg") && !url.endsWith(".png"))
      continue;
    
    let path = `./temps/search-image-${counter}.jpg`;
    let hasError = false;
    await cloudscraper.get({uri: url, encoding: null})
      .then((buffer) => fs.writeFileSync(path, buffer))
      .catch((error) => {
        console.log(error)
        hasError = true;
      });
      
    if(hasError)
      continue;
    
    console.log(`Pushed to streams: ${path}`) ;
    streams.push(fs.createReadStream(path).on("end", async () => {
      if(fs.existsSync(path)) {
        fs.unlink(path, (err) => {
          if(err) return console.log(err);
            
          console.log(`Deleted file: ${path}`);
        });
      }
    }));
    
    counter += 1;
  }
  
  api.sendMessage("⏳ Sending search result...", event.threadID, event.messageID)
  
  let msg = {
    body: `--------------------\nImage Search Result\n\nFound: ${result.length} image${result.length > 1 ? 's' : ''}\nOnly showing: 6 images\n\n--------------------`,
    attachment: streams
  };
  
  api.sendMessage(msg, event.threadID, event.messageID);
};

module.exports = async (matches, event, api, extra) => {
  global.imageSearchQueue.enqueue(async () => {
    await imageSearch(matches, event, api, extra);
  })
};