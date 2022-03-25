const fs = require('fs');
const login = require('fca-unofficial');
const dotenv = require('dotenv');
const {
  multilineRegex
} = require("./regex");
const pipeline = require("./pipeline");
const global = require("../../global");
const configs = require("../../configs");

// Initialize env
dotenv.config();

let commands = [];
let commandMiddlewares = [];
let eventMiddlewares = [];

let options = {};

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

const add = (callback, option) => commands.push({
  callback, option
});
const list = () => commands.map((command) => command.option);

const addCommandMiddleware = (...middleware) => {
  commandMiddlewares.push(...middleware);
}

const addEventMiddleware = (...middleware) => {
  eventMiddlewares.push(...middleware);
};

const init = (option = {}) => {
  options = {
    ...options,
    ...option
  };

  try {
    /**
    * DISABLED THIS SOLUTION AND SWITCHED TO ENVIRONMENT VARIABLES
    const appState = JSON.parse(
    fs.readFileSync(options.APP_STATE_FILE,
    {encoding: "utf8"}
    ));
    */
    const appState = JSON.parse(process.env.APPSTATE);
    
    login({ appState }, (err, api) => {
      if (err) return console.error(err);

      let settingsList = openSettings();
      let prefix = settingsList.defaultSettings.prefix;
      api.setOptions({
        listenEvents: options.listenEvents || true, selfListen: options.selfListen || false
      });

      let listenEmitter = api.listen(async (err, event) => {
        if (err) return console.error(err);

        /**
        * DISABLED THIS SOLUTION AND SWITCHED TO ENVIRONMENT VARIABLES
        fs.writeFileSync(
        options.APP_STATE_FILE,
        JSON.stringify(api.getAppState(), undefined, 4),
        {encoding: "utf8"}
        );
        */

        process.env.APPSTATE = JSON.stringify(api.getAppState());

        const eventCallback = () => {
          return async(event, api) => {};
        };
        global.eventsQueue.enqueue(async () => {
          await pipeline([...eventMiddlewares, eventCallback], event, api);
        });

        settingsList = openSettings();
        const threadSettings = settingsList.threads[event.threadID] || settingsList.defaultSettings;
        prefix = threadSettings.prefix;

        commands.forEach((command) => {
          if (typeof (command.callback) === "function" && event.body !== undefined) {
            const _prefix_ = event.body.substring(0, prefix.length);

            if (command.option.params === undefined)
              return console.error("[SnoopBot]: No commands added, please add atleast 1 command");

            const commandPrefix = command.option.prefix || prefix;
            let bodyCommand = event.body.substring(prefix.length);

            bodyCommand = bodyCommand.replace(/\n/g, " ");

            const regexp = new RegExp(command.option.params, "gim");
            const matches = multilineRegex(regexp, bodyCommand);
            const handleMatches = command.option.handleMatches === undefined
            ? options.handleMatches === undefined
            ? false: options.handleMatches: command.option.handleMatches;

            if ((commandPrefix == _prefix_ && matches.length !== 0) || handleMatches) {
              let extra = {
                ...command.option,
                commands: list(),
                global
              };

              const commandCallback = () => {
                return async (matches, event, api, extra) => {
                  return command.callback(matches, event, api, extra);
                };
              };

              pipeline([...commandMiddlewares, commandCallback], matches, event, api, extra);
            }
          }
        });
      });
    });
  } catch(err) {
    console.log("[SnoopBot]: ", err.message);
  }
};

process.on("uncaughtException", (err) => console.log("[SnoopBot]: ", err));

module.exports = {
  add,
  list,
  init,
  addCommandMiddleware,
  addEventMiddleware
};