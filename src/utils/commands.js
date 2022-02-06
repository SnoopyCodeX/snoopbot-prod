const fs = require('fs');
const login = require('fca-unofficial');
const { multilineRegex } = require("./regex");
const pipeline = require("./pipeline");

let commands = [];
let commandMiddlewares = [];
let eventMiddlewares = [];

let options = {};

const add = (callback, option) => commands.push({callback, option});
const list = () => commands.map((command) => command.option);

const addCommandMiddleware = (...middleware) => {
	commandMiddlewares.push(...middleware);
}

const addEventMiddleware = (...middleware) => {
	eventMiddlewares.push(...middleware);
};

const init = ( option = {} ) => {
	options = {...options, ...option};
	
	try {
		const appState = JSON.parse(fs.readFileSync(options.APP_STATE_FILE, {encoding: "utf8"}));
		
		login({ appState }, (err, api) => {
			if(err) return console.error(err);
			
			const prefix = options.DEFAULT_PREFIX;
			const enableAntiUnsend = options.ENABLE_ANTI_UNSEND !== undefined ? options.ENABLE_ANTI_UNSEND : false;
			const enableAutoGreet = options.ENABLE_AUTO_GREET !== undefined ? options.ENABLE_AUTO_GREET : false;
			
			api.setOptions({listenEvents: true});
			
			let listenEmitter = api.listen(async (err, event) => {
				if(err) return console.error(err);
				
				fs.writeFile(options.APP_STATE_FILE, JSON.stringify(api.getAppState()), 
                   {encoding: "utf8"},
                   (err) => {  if(err) console.error(err); });
               
                const eventCallback = () => {
                     return async(event, api) => {};
                };    
                pipeline([...eventMiddlewares, eventCallback], event, api);
				
				commands.forEach((command) => {
					if(typeof (command.callback) === "function" && event.body !== undefined) {
						const _prefix_ = event.body.substring(0, 1);
						
						if(command.option.params === undefined)
						    return console.error("[SnoopBot]: No commands added, please add atleast 1 command");
						
						const commandPrefix = 
                            command.option.prefix === undefined 
                                ? prefix
                                : command.option.prefix;
                                
                        const bodyCommand = event.body.substring(1);
                        const regexp = new RegExp(command.option.params, "gim");
                        const matches = multilineRegex(regexp, bodyCommand);
                        const handleMatches = command.option.handleMatches === undefined
                            ? options.handleMatches === undefined
                                ? false
                                 : options.handleMatches
                             : command.option.handleMatches;
                        
                        if((commandPrefix == _prefix_ && matches.length !== 0) || handleMatches) {
                        	let extra = {...command.option, commands: list()};
                        
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

process.on("uncaughtException", (err) => console.log("[SnoopBot]: ", err.message));

module.exports = {
	add,
	list,
	init,
	addCommandMiddleware,
	addEventMiddleware
};