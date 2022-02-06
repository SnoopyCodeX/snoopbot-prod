const fs = require("fs");
const axios = require("axios");
const http = require("https");

const tiktokDownloader = async (link) => {
    let out = await axios.get("https://www.tiktokdownloader.org/check.php?v=" + link)
                       .then((response) => { 
                           return response.data.download_url 
                       }).catch((error) => { return error; });
    return out;
};

const tiktok = async (matches, event, api, commands) => {
	let url = matches[1];
	
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
			
			let video = fs.createWriteStream("tiktok.mp4");
			let downloadUrl = response;
			let request = http.get(downloadUrl, (res) => {
			    res.pipe(video);
			    video.on("finish", () => {
				    stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
					    if(err) return console.log(err);
					
					    api.sendMessage("📀 Download complete! Sending, please wait...", event.threadID, event.messageID);
					    let msg = {
						    body: "🤖 Tiktok video downloader made with ❤️ by John Roy L. Calimlim",
						    attachment: fs.createReadStream("tiktok.mp4")
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