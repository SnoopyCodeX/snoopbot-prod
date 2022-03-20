const Queue = require("./src/utils/queue");

const playerQueue = new Queue(1, "PlayerQueue");
const eventsQueue = new Queue(1, "EventsQueue");
const imageSearchQueue = new Queue(1, "ImageSearchQueue");

module.exports = {
  playerQueue,
	eventsQueue,
	imageSearchQueue
};