const Queue = require("./src/utils/queue");

const playerQueue = new Queue(1, "PlayerQueue");
const eventsQueue = new Queue(1, "EventsQueue");

module.exports = {
    playerQueue,
	eventsQueue
};