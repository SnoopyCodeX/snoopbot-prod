const fs = require("fs");
const configs = require("../../configs");

const toOrdinalNumber = (number) => {
  let _strNumber = `${number}`;
  let _prevNumber = _strNumber.split("")[_strNumber.length - 2];
  let _lastNumber = _strNumber.split("")[_strNumber.length - 1];

  switch (_lastNumber) {
    case "1":
      _strNumber += (_prevNumber === "1") ? "th" : "st";
      break;

    case "2":
      _strNumber += (_prevNumber === "1") ? "th" : "nd";
      break;

    case "3":
      _strNumber += (_prevNumber === "1") ? "th" : "rd";
      break;

    default:
      _strNumber += "th";
      break;
  }

  return _strNumber;
};

const saveSettings = (settings) => {
  fs.writeFileSync(configs.APP_SETTINGS_LIST_FILE, JSON.stringify(settings, undefined, 4), {
    encoding: "utf8"
  });
}

const openSettings = () => {
  return JSON.parse(fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, {
    encoding: "utf8"
  }));
}

module.exports = (next) => {
  return async (event, api) => {
    if (event.type === "event") {
      switch (event.logMessageType) {
        case "log:subscribe": // Someone joined the gc
          // Get thread info
          const thread1 = await api.getThreadInfo(event.threadID);

          // Check if this thread is a Group (more than 2 members)
          // Ignore this thread if this is not a group
          if (!thread1.isGroup)
            return;

          // Get settings for this specific thread
          let settingsList1 = openSettings();
          if (settingsList1.threads[event.threadID] === undefined)
            settingsList1.threads[event.threadID] = settingsList1.defaultSettings;

          saveSettings(settingsList1);
          let settings1 = settingsList1.threads[event.threadID];

          let threadName1 = thread1.threadName;
          let participants1 = thread1.userInfo;
          let addedParticipants1 = event.logMessageData.addedParticipants;
          let botID1 = await api.getCurrentUserID();
          let message1 = {
            mentions: [],
            body: ""
          };

          // Loop through all added participants
          for (let newParticipant of addedParticipants1) {
            // If the added participant is the bot itself, just send a greeting message then break this loop.
            if (newParticipant.userFbId == botID1) {
              message1.body = `Hi, I am SnoopBot. Thank you for having me as the ${toOrdinalNumber(participants1.length)} member of "${threadName1}".\n\n`;
              message1.body += `Type ${settings1.prefix}help to see the list  of available commands. Please remember to not spam the bot to avoid the bot from being muted by fb. Thank you for your kind understanding! <3\n\n~Author: @John Roy Lapida Calimlim`;
              message1.mentions.push({
                tag: "@John Roy Lapida Calimlim", id: "100031810042802"
              });

              // Set bot's nickname
              api.changeNickname("SnoopBot", event.threadID, botID1, (err) => {
                if (err) return console.error(err);
              });
              break;
            }

            // Don't greet if auto greet is disabled in this thread's settings
            if (!settings1.autoGreetEnabled)
              return;

            let firstName = newParticipant.firstName;
            let id = newParticipant.userFbId;
            message1.body = `Welcome @${firstName}, you are the ${toOrdinalNumber(participants1.length)} member of "${threadName1}"!\n\nPlease follow the rules and regulations of this group, respect all members and admins.\n\nWe hope that we'll know about you better and we'd have a great friendship ahead. <3`;
            message1.mentions.push({
              id, tag: `@${firstName}`
            });
          }

          api.sendMessage(message1, event.threadID);
          break;

        case "log:unsubscribe": // Someone left the gc
          // Get thread info
          const thread2 = await api.getThreadInfo(event.threadID);

          // Check if this thread is a Group (more than 2 members)
          // Ignore this thread if this is not a group
          if (!thread2.isGroup)
            return;

          // Get settings for this specific thread
          let settingsList2 = openSettings();
          if (settingsList2.threads[event.threadID] === undefined)
            settingsList2.threads[event.threadID] = settingsList2.defaultSettings;

          saveSettings(settingsList2);
          let settings2 = settingsList2.threads[event.threadID];

          let threadName = thread2.threadName;
          let leftParticipantFbId = event.logMessageData.leftParticipantFbId;
          let botID = await api.getCurrentUserID();
          let message = {
            mentions: [],
            body: ""
          };

          // If the participant that left is the bot itself, ignore
          if (leftParticipantFbId == botID)
            break;

        // Don't greet if auto greet is disabled in this thread's settings
        if (!settings2.autoGreetEnabled)
          return;

        let user = await api.getUserInfo(leftParticipantFbId);
        let name = user[leftParticipantFbId].name;
        message.body = `Farewell @${name}, the whole ${threadName} will be awaiting for your return!\n\nGoodbye for now and may you have a blessed day ahead! <3`;
        message.mentions.push({
          id: leftParticipantFbId, tag: `@${name}`
        });

        api.sendMessage(message, event.threadID);
        break;
      }
    }

    await next(event, api);
  };
};