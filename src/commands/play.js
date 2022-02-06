const fs = require("fs");
const https = require("https");
const google = require("googlethis");
const axios = require("axios");
const configs = require("../../configs");
const streams = require("stream");
const YoutubeMusicAPI = require("youtube-music-api");
const DiceCoefficient = require("../utils/dice_coefficient");

const convert = async (videoId, token, expire) => {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-Key': 'de0cfuirtgf67a'
    };
    
    const response = await axios.post("https://backend.svcenter.xyz/api/convert-by-45fc4be8916916ba3b8d61dd6e0d6994", 
            "v_id=" + videoId + 
            "&ftype=mp3&fquality=128&token=" + token + 
            "&timeExpire=" + expire + "&client=yt5s.com", 
            { headers: headers })
        .then((response) => {return response.data.d_url})
        .catch((error) => {
        	console.log(error);
            return undefined;
        });
        
    return response;
};

const fetch = async (query) => {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    const response = await axios.post("https://yt5s.com/api/ajaxSearch", 
            "q=" + query + 
            "&vt=mp3", 
           { headers: headers })
        .then((response) => {return response.data})
        .catch((error) => {
             console.log(error);
             return undefined;
         });
         
    return response;
};

const leechMP3 = async (videoID) => {
	let response = await fetch(videoID).then((res) => {
		if(res !== undefined && res.t < 1300) {
			let downloadUrl = convert(res.vid, res.token, res.timeExpires).then((res) => {return [res, res.title]});
			return downloadUrl;
		}
		
		console.log(res);
		return undefined;
	});
	
	return response;
};

const getSongLyrics = async (song) => {
	let options = {
		page: 0,
		safe: false,
		additional_params: {
			hl: "en"
		}
	};
	
	return await google.search(`${song} song lyrics`, options);
};

const getBestMatch = (song, ...songs) => {
	let bestMatchIndex = 0;
	let matches = [];
	
	for(let i = 0; i < songs.length; i++) {
		let currentSong = songs[i];
		let score = DiceCoefficient(song.toLowerCase(), currentSong.name.toLowerCase());
		
		matches.push({rate: score, bestMatch: currentSong});
		bestMatchIndex = (matches[bestMatchIndex].rate > score) ? i : bestMatchIndex;
	}
	
	return matches[bestMatchIndex].bestMatch;
}

const getYTMusic = async (song) => {
	let api = new YoutubeMusicAPI();
	await api.initalize();
	
	let music = await api.search(`${song} lyrics`, "song").then((res) => {
		let contents = res.content;
		let _id = "";
		
		let songs = contents.map((content) => {
            let _song = {name: content.name, videoId: content.videoId};
            return _song;
        });
        
		let bestMatch = getBestMatch(song, ...songs);
		return bestMatch;
	});
	
	return music;
};

module.exports = async (matches, event, api, extra) => {
	let song = matches[1];
	
	if(song === undefined) {
		let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
			if(err) return console.log(err);
			
			api.sendMessage(`⚠️ Invalid usage of command: ${configs.DEFAULT_PREFIX}play\n\nUsage: ${extra.option.usage}`, event.threadID, event.messageID);
			stopTyping();
		});
		
		return;
	}
	
	let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
		if(err) return console.log(err);
			
		api.sendMessage(`⏳ Processing request...`, event.threadID, event.messageID);
		stopTyping();
	});
	
	let responseLyrics = await getSongLyrics(song);
	let lyrics = responseLyrics.knowledge_panel.lyrics || "*No lyrics found*";
	let title = responseLyrics.knowledge_panel.title === "N/A" ? "" : responseLyrics.knowledge_panel.title;
	let type = responseLyrics.knowledge_panel.type || "";
	
	let ytQuery = song;
	if(song.lastIndexOf("by") === -1) 
	    ytQuery = `${song} ${type.replace(/\b(Song )\b/g, '')}`;
	
	let ytVideo = await getYTMusic(ytQuery);
	let downloadUrl = await leechMP3(ytVideo.videoId);
	
	if(downloadUrl === undefined) {
		let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
			if(err) return console.log(err);
			
			api.sendMessage(`⚠️ Cannot play song: '${song}'`, event.threadID, event.messageID);
			stopTyping();
		});
		
		return;
	}
	
	if(title.length === 0)
	    title = downloadUrl[1] ?? ytVideo.name ?? `${song}?`;
	
	let body = `💽 Playing ${title} ${type}\n\n${lyrics}`;
	let msg = {body: body};
	
	let path = `./temps/attachment-song.mp3`;
	let file = fs.createWriteStream(path);
	let stream = https.get(downloadUrl[0], (res) => {
		res.pipe(file);
		
		file.on("finish", () => {
			msg.attachment = fs.createReadStream(path).on("end", async () => {
		        if(fs.existsSync(path)) {
			        fs.unlink(path, (err) => {
				        if(err) return console.log(err);
				
				        console.log("Deleted file: " + path);
			        });
		        }
	        });
	
	        api.sendMessage(msg, event.threadID, event.messageID);
		});
	});
};