const fs = require("fs");
const https = require("https");
const cheerio = require("cheerio");
const google = require("googlethis");
const axios = require("axios");
const configs = require("../../configs");
const YoutubeMusicAPI = require("youtube-music-api");
const DiceCoefficient = require("../utils/dice_coefficient");

/*
*  Converts youtube video to .mp3 or .mp4
*  then returns the download url
*
*  @videoId  ->  Youtube video id
*/
const getDownloadUrl = async (videoId, options = {bitrate: 320, type: 'mp3'}) => {
	let serverURL = "https://api.vevioz.com";
	
	let downloadURL = await axios.get(`${serverURL}/?v=${videoId}&type=${options.type}&bitrate=${options.bitrate}`)
	    .then(response => {
		    let $ = cheerio.load(response.data);
		    let div = $("div#mediaDownload")[0];
		    let lst = div.children[1].children[1].children[1];
		    let title = div.attribs['data-yt-title'];
		    let tag = lst.attribs['data-mp3-tag'];
		
		    return `${serverURL}/download/${tag}/${title}.mp3`;
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
	let songQuery = matches[1]; 
	
	if(songQuery === undefined) {
		let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
			if(err) return console.log(err);
			
			api.sendMessage(`🛑 Invalid usage of command: ${configs.DEFAULT_PREFIX}play\n\nUsage: ${extra.usage}`, event.threadID, event.messageID);
			stopTyping();
		});
		
		return;
	}
	
	let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
		if(err) return console.log(err);
			
		api.sendMessage(`⏳ Processing request...`, event.threadID, event.messageID);
		stopTyping();
	});
	
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
		let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
			if(err) return console.log(err);
			
			api.sendMessage(`тЪая╕П Cannot play song: '${songQuery}'`, event.threadID, event.messageID);
			stopTyping();
		});
		
		return;
	}
	
	// If title is not indicated on the lyrics
	if(title.length === 0)
	    title = songYTRequest.name ?? `${songQuery}?`;
	
    // Download and send the audio back to the convo
    let body = `📀 Playing ${title} ${author}\n\n${lyrics}`;
    let msg = {body};
    
    let path = './temps/attachment-song.mp3';
    let file = fs.createWriteStream(path);
    let stream = axios.get(downloadURL, (res) => {
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