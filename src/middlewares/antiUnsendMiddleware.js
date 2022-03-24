const fs = require("fs");
const axios = require("axios");
const streams = require("stream");
const mime = require("mime");
const configs = require("../../configs");
const adminUtls = require("../utils/adminUtils");

let msgs = {};

const bufferToReadable = (buffer) => {
  let readable = new streams.Readable({
    read() {}
  });
  readable.push(buffer);
  readable.push(null);

  return readable;
};

const getExt = (filetype) => {
  return filetype === "photo" ? ".jpg":
  filetype === "audio" ? ".mp3":
  filetype === "animated_image" ? ".gif":
  filetype === "video" ? ".mp4":
  filetype === "sticker" ? ".png": "";
};

module.exports = (next) => {
  return async (event, api) => {

    // Check if anti unsent is enabled in this thread's settings
    const settingsList = JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {
      encoding: "utf8"
    }));
    const settings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
    if (!settings.antiUnsendEnabled) {
      await next(event, api);
      return;
    }

    // Check if this thread is whitelisted
    let threadWhitelist = JSON.parse(fs.readFileSync(configs.APP_THREAD_WHITELIST_FILE, {
      encoding: "utf8"
    }));
    let adminWhitelist = adminUtils.getAdminsFromThread(event.threadID);
    let admins = adminWhitelist.hasError ? [] : adminWhitelist.admins;
    let owner = adminWhitelist.botOwner;
    
    if (!threadWhitelist.threads.includes(event.threadID)) {
      await next(event, api);
      return;
    }

    let attachments = event.attachments;
    let messageID = event.messageID;
    let senderID = event.senderID;
    let threadID = event.threadID;
    let message = event.body;
    let mentions = event.mentions;

    switch (event.type) {
      case "message":
      case "message_reply":

        if (attachments.length !== 0)
          msgs[messageID] = attachments;

        if (message.length !== 0)
          if (msgs[messageID] !== undefined)
            for (let msg of msgs[messageID]) {
              msg.msg = message;
              msg.mentions = mentions;
            } 
          else
            msgs[messageID] = {
              msg: message,
              mentions,
              normal: true
            };

        break;

      case "message_unsend":
        if(!admins.includes(senderID) && senderID !== (await api.getCurrentUserID()) && senderID !== owner) {
        // if (true) {
          let deletedMessages = msgs[messageID];

          if (deletedMessages.normal) {
            api.getUserInfo(senderID, (err, info) => {
              if (err) return console.log(err);

              // Include mentions
              let _mentions = [];
              for (let id in deletedMessages.mentions)
                _mentions.push({
                id, tag: deletedMessages.mentions[id]});

              let user = info[senderID];
              let msg = {
                body: `🤭 @${user.firstName} unsent this message: \n\n${deletedMessages.msg}`,
                mentions: [{
                  tag: `@${user.firstName}`,
                  id: senderID
                },
                  ..._mentions]
              };

              api.sendMessage(msg, threadID);
            });
          } else {
            let shareDetected = false;

            // Loop through all deleted attachments
            for (let deletedMessage of deletedMessages) {
              // For deleted stickers
              if (deletedMessage.type === "sticker") {
                shareDetected = true;

                api.getUserInfo(senderID, (err, info) => {
                  if (err) return console.log(err);

                  // Include mentions
                  let _mentions = [];
                  for (let id in deletedMessage.mentions)
                    _mentions.push({
                    id, tag: deletedMessage.mentions[id]
                  });

                  let user = info[senderID];
                  let msg = {
                    body: `🤭 @${user.firstName} unsent this sticker: \n\n${deletedMessage.msg || ''}`,
                    mentions: [{
                      tag: `@${user.firstName}`,
                      id: senderID
                    },
                      ..._mentions],
                    sticker: deletedMessage.stickerID
                  };

                  api.sendMessage(msg, threadID);
                });

                continue;
              }

              // For messages that contains, urls
              if (deletedMessage.type === "share") {
                shareDetected = true;

                // For deleted live location
                if (deletedMessage.source === null) {
                  api.getUserInfo(deletedMessage.target.sender.id, (err, info) => {
                    if (err) return console.log(err);

                    let user = info[deletedMessage.target.sender.id];
                    let latitude = deletedMessage.target.coordinate.latitude;
                    let longitude = deletedMessage.target.coordinate.longitude;
                    let msg = {
                      body: ` @${user.firstName} unsent this live location: \n\n${deletedMessage.msg || ''}`,
                      mentions: [{
                        tag: `@${user.firstName}`,
                        id: deletedMessage.target.sender.id
                      }],
                      location: {
                        latitude,
                        longitude,
                        current: false
                      }
                    };

                    api.sendMessage(msg, threadID);
                  });

                  continue;
                }

                // For deleted messages with urls
                api.getUserInfo(senderID,
                  (err, info) => {
                    if (err) return console.log(err);

                    // Include mentions
                    let _mentions = [];
                    for (let id in deletedMessage.mentions)
                      _mentions.push({
                      id, tag: deletedMessage.mentions[id]
                    });

                    let user = info[senderID];
                    let msg = {
                      body: `🤭 @${user.firstName} unsent this message: \n\n${deletedMessage.msg}`,
                      mentions: [{
                        tag: `@${user.firstName}`,
                        id: senderID
                      },
                        ..._mentions],
                      url: deletedMessage.url
                    };

                    api.sendMessage(msg, threadID);
                  });

                continue;
              }

              // For deleted location
              if (deletedMessage.type === "location") {
                let longitude = deletedMessage.longitude;
                let latitude = deletedMessage.latitude;
                shareDetected = true;

                api.getUserInfo(senderID, (err, info) => {
                  if (err) return console.log(err);

                  let user = info[senderID];
                  let msg = {
                    body: `🤭 @${user.firstName} unsent this location: \n\n${deletedMessage.msg || ''}`,
                    mentions: [{
                      tag: `@${user.firstName}`,
                      id: senderID
                    }],
                    location: {
                      latitude,
                      longitude,
                      current: false
                    }
                  };

                  api.sendMessage(msg, threadID);
                });

                continue;
              }
            }

            // Stop here if user unsent a shared attachment
            if (shareDetected) {
              shareDetected = false;
              return;
            }

            let streams = [];
            let _mentions = [];
            for (let deletedMessage of deletedMessages) {
              let url = deletedMessage.type !== "photo" ? deletedMessage.url: deletedMessage.largePreviewUrl;
              let ext = deletedMessage.type !== "file" ? getExt(deletedMessage.type): "";
              let path = `./temps/${deletedMessage.filename}${ext}`;
              let response = await axios.get(url, {
                responseType: "arraybuffer"
              });
              let data = null;

              if (response.status === 200)
                data = response.data;
              else
                return console.log(response);

              let readStream = bufferToReadable(Buffer.from(data, "utf-8"));
              let writeStream = fs.createWriteStream(path);
              readStream.pipe(writeStream);

              writeStream.on("finish", () => {
                writeStream.end();
                readStream.destroy();
              });

              streams.push(fs.createReadStream(path).on("end", async () => {
                if (fs.existsSync(path)) {
                  fs.unlink(path, (err) => {
                    if (err) return console.log(err);

                    console.log(`Deleted file: ${path}`);
                  });
                }
              }));

              // Include mentions
              for (let id in deletedMessage.mentions)
                _mentions.push({
                id, tag: deletedMessage.mentions[id]});
            }

            api.getUserInfo(senderID, (err, info) => {
              if (err) return console.log(err);

              let user = info[senderID];
              let msg = {
                body: `🤭 @${user.firstName} unsent these attachment(s): \n\n${deletedMessages[0].msg || ""}`,
                mentions: [{
                  tag: `@${user.firstName}`,
                  id: senderID
                },
                  ..._mentions],
                attachment: streams
              };

              api.sendMessage(msg, threadID);
            });
          }
        }
        break;
    };

    await next(event, api);
  };
};