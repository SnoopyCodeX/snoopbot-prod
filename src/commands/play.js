const fs = require("fs");
const https = require("https");
const cheerio = require("cheerio");
const google = require("googlethis");
const axios = require("axios");
const cloudscraper = require("cloudscraper");
const configs = require("../../configs");
const YoutubeMusicAPI = require("youtube-music-api");
const DiceCoefficient = require("../utils/dice_coefficient");

/*
*  Converts youtube video to .mp3 or .mp4
*  then returns the download url
*
*  @param   videoId  ->  Youtube video id
*  
*  Optional:
*  @param  options  ->  Additional options for conversions
*  @param  options.title  ->  Title of the video/audio (Default: empty)
*  @param  options.bitrate  ->  Bitrate conversion (Default: 320kbps)
*  @param  options.type  ->  Type of conversion  (Default: mp3)
*/
const getDownloadUrl = async (videoId, options = {type: 'mp3', title: ''}) => {
	let serverURL = "https://api.vevioz.com/api/button";
	
	let downloadURL = await axios.get(`${serverURL}/${options.type}/${videoId}`)
	    .then(response => {
		    let $ = cheerio.load(response.data);
		    let a = $("div.download > a")['0'];
		    let href = a.attribs.href;
		
		    console.log(href);
		    console.log(a);
		    return href;
		}).catch((err) => {
			console.log(err);
			
			return undefined;
		});
	
	return downloadURL;
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
		
		if(currentSong.name === undefined || currentSong.videoId === undefined)
		    continue;
		
		let score = DiceCoefficient(song.toLowerCase(), currentSong.name.toLowerCase());
		
		matches.push({rate: score, bestMatch: currentSong});
		bestMatchIndex = (matches[bestMatchIndex].rate > score) ? i : bestMatchIndex;
	}
	
	return matches[bestMatchIndex].bestMatch;
}

const getYTMusic = async (song) => {
	let api = new YoutubeMusicAPI();
	await api.initalize();
	
	let music = await api.search(`${song}`).then((res) => {
		let contents = res.content;
		let _id = "";
		
		let songs = contents.map((content) => {
            let _song = {name: content.name, videoId: content.videoId, author: content.author};
            return _song;
        });
        
		let bestMatch = getBestMatch(song, ...songs);
		return bestMatch;
	});
	
	return music;
};

const player = async (matches, event, api, extra) => {
	let songQuery = matches[1]; 
	
	if(songQuery === undefined) {
		api.sendMessage(`🛑 Invalid usage of command: ${configs.DEFAULT_PREFIX}play\n\nUsage: ${extra.usage}`, event.threadID, event.messageID);
		return;
	}
	
	// Get song lyrics from google
	let lyricsRequest = await getSongLyrics(songQuery);
	let lyricsResponse = lyricsRequest.knowledge_panel;
	let lyrics = lyricsResponse.lyrics || "*No lyrics found*";
	let title = lyricsResponse.title === "N/A" ? "" : lyricsResponse.title;
	let author = lyricsResponse.type || "";
	
	// Indicate the song author if there's any
	let ytSongQuery = songQuery;
	if(songQuery.indexOf("by") === -1)
	    ytSongQuery = `${songQuery} ${author.replace(/\b(Song )\b/g, "")}`;
	
	// Search the song on youtube and get download url
	let songYTRequest = await getYTMusic(ytSongQuery);
	let downloadURL = await getDownloadUrl(songYTRequest.videoId);
	
	// Abort downloading and sending audio if no download url is returned
	if(downloadURL === undefined) {
		api.sendMessage(`🚨 Cannot play song: '${songQuery}'`, event.threadID, event.messageID);
		return;
	}
	
	// If title is not indicated on the lyrics
	if(title.length === 0)
	    title = songYTRequest.name || `${songQuery}?`;
	
    // Download and send the audio back to the convo
    let body = `📀 Playing ${title} ${author}\n\n${lyrics}`;
    let msg = {body};
    let path = `./temps/${title.replace(/\s/g, '-')}.mp3`;
    
    api.sendMessage(`💽 Found:\n\n ${title} by ${songYTRequest.author} \n\n💽 Downloading...`, event.threadID, event.messageID);
    
    cloudscraper.get({uri: downloadURL, encoding: null})
        .then((buffer) => fs.writeFileSync(path, buffer))
        .then((res) => {
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
};

module.exports = async (matches, event, api, extra) => {
    api.sendMessage("📑 Request added to the queue.", event.threadID, event.messageID)
    
    setTimeout(() => extra.global.playerQueue.enqueue(async () => {
    	api.sendMessage(`⏳ Processing request...`, event.threadID, event.messageID);
        await player(matches, event, api, extra);
    }), 500);
};