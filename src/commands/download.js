const fs = require("fs");
const axios = require("axios");
const http = require("https");
const configs = require("../../configs");

const tiktokDownloader = async (link) => {
    let out = await axios.get("https://www.tiktokdownloader.org/check.php?v=" + link)
                       .then((response) => { 
                           return response.data.download_url 
                       }).catch((error) => { return error; });
    return out;
};

const tiktok = async (matches, event, api, extra) => {
	let url = matches[1];
	
	if(url === undefined) {
		let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
			api.sendMessage(`⚠️ Invalid use of command: '${configs.DEFAULT_PREFIX}downloadTiktok'\nUsage: ${extra.usage}`, event.threadID, event.messageID);
			stopTyping();
        });
        
        return;
	}
	
	try {
		let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
			api.sendMessage("⏳ Downloading, please wait...", event.threadID, event.messageID);
			stopTyping();
        });
		
		tiktokDownloader(url).then((response) => {
			if(typeof (response) === "object") {
				stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
					api.sendMessage("🚨 Download failed, cause: " + response.message, event.threadID, event.messageID);
					stopTyping();
				});
				
				return;
			}
			
			let path = "./temps/tiktok.mp4";
			let video = fs.createWriteStream(path);
			let downloadUrl = response;
			let request = http.get(downloadUrl, (res) => {
			    res.pipe(video);
			    video.on("finish", () => {
				    stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
					    if(err) return console.log(err);
					
					    api.sendMessage("📀 Download complete! Sending, please wait...", event.threadID, event.messageID);
					    let msg = {
						    body: "🤖 Tiktok video downloader made with ❤️ by John Roy L. Calimlim",
						    attachment: fs.createReadStream(path).on("end", async () => {
							    if(fs.existsSync()) {
								    fs.unlink(path, (err) => {
									    if(err) return console.log(err);
									
									    console.log("Deleted file: " + path);
									});
								}
							})
						};
						
						api.sendMessage(msg, event.threadID, event.messageID);
						stopTyping();
					});
				});
			});
		});
	} catch(err) {
		let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
			if(err) return console.log(error);
			
			api.sendMessage("🚨 Download failed, cause: " + err.message, event.threadID, event.messageID);
			stopTyping();
		});
	}
};

module.exports = {
	tiktok
};