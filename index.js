const configs = require("./configs.js");
const commands = require("./src/utils/commands");
const command = require("./src/commands/allCommands");

const permissionMiddleware = require("./src/middlewares/permissionMiddleware");
const newParticipantMiddleware = require("./src/middlewares/newParticipantMiddleware");
const joinOrLeaveMiddleware = require("./src/middlewares/joinOrLeaveMiddleware");
const antiUnsendMiddleware = require("./src/middlewares/antiUnsendMiddleware");
const commandValidatorMiddleware = require("./src/middlewares/commandValidatorMiddleware");

commands.init({...configs, selfListen: true, handleMatches: true});

commands.addEventMiddleware(
	newParticipantMiddleware,
    antiUnsendMiddleware
);

commands.addCommandMiddleware(
    joinOrLeaveMiddleware,
    commandValidatorMiddleware,
    permissionMiddleware,
);

commands.add(command.settings.settings, {
	params: '^settings\\s(.*)\\s(.*)',
	usage:  "settings <bot settings> <option>",
	description: "Updates bot's settings from the current thread",
	name: "settings",
	hasArgs: true
});

commands.add(command.settings.list, {
	params: '^settings\\slist\\s?(.*)?',
	usage:  "settings list",
	description: "Lists bot's settings from the current thread",
	name: "settings-list"
});

commands.add(command.say.say, {
	params: '^say\\s(\\w+)\\s(.*)',
	usage:  "say <language> <word/phrase>",
	description: "Sends an audio recording of the word/phrase",
	name: "say",
	hasArgs: true
});

commands.add(command.say.list, {
	params: '\\b(say languages-list)\\b',
	usage:  "say languages-list",
	description: "Lists all the supported text-to-speech languages",
	name: "say languages-list",
	hasArgs: true
});

commands.add(command.download.tiktok, {
	params: '^downloadTiktok\\s?(.*)?',
	usage: "downloadTiktok <tiktok-video-url>",
	description: "Downloads videos from the tiktok",
	name: "downloadTiktok",
	hasArgs: true
});

commands.add(command.play, {
	params: '^play\\s?(.*)?',
	usage: "play <song title>",
	description: "Plays a song from youtube music and returns the lyrics of the song if there's any",
	name: "play",
	hasArgs: true
});

commands.add(command.wiki, {
	params: '^wiki\\s?(.*)?',
	usage: "wiki <query>",
	description: "Send a search query to Wikipedia's API",
	name: "wiki",
	hasArgs: true
});

commands.add(command.translate, {
	params: '^translate\\s(.*)\\sto\\s(.*)',
	usage: "translate <phrase> to <language>",
	description: "Translates a phrase/word using Google Translate API",
	name: "translate",
	hasArgs: true
});

commands.add(command.define, {
	params: '^define\\s?(.*)?',
	usage: "define <word>",
	description: "Returns the definition of the word using Google Dictionary API",
	name: "define",
	hasArgs: true
});

commands.add(command.info, {
	params: '^info\\s?(.*)?', 
    usage: "info",
    description: "Shows information about SnoopBot.",
    name: "info"
});

commands.add(command.help, {
    params: '^help\\s?(.*)?', 
    usage: "help",
    description: "Shows a list of available commands.",
    name: "help"
});

commands.add(command.join, {
	params: '^join\\s?(.*)?',
    usage: "join",
    description: "Allows SnoopBot to respond to every commands in a conversation.",
    name: "join"
});

commands.add(command.leave, {
	params: '^leave\\s?(.*)?', 
    usage: "leave",
    description: "Prevents SnoopBot from responding to every commands in a conversation.",
    name: "leave"
});

commands.add(command.permission.grant, {
	params: '^permission\\sgrant\\s([^@]+)\\s(.*)',
	usage: "permission grant <all | command> <all | person-name>",
	description: "Grants permission to all or a specific command to all members or specific member of a conversation.",
	name: "permission-grant",
	hasArgs: true
});

commands.add(command.permission.revoke, {
	params: '^permission\\srevoke\\s([^@]+)\\s(.*)',
	usage: "permission revoke <all | command> <all | person-name>",
	description: "Revokes permission to all or a specific command to all members or a specific member of a conversation.",
    name: "permission-revoke",
    hasArgs: true
});
/*
commands.add(command.permission.list, {
	params: '^permission\\slist\\s([^@]+)\\s(.*)',
	usage: "permission list <all | command> <all | person-name>",
	description: "Lists permissions that are granted to all or a specific member of a conversation.",
	name: "permission-list",
	hasArgs: true
});
*/
