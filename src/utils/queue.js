class Queue {
    constructor(maxSimultaneously = 1, name = '') {
        this.maxSimultaneously = maxSimultaneously;
        this.name = name;
        this.__active = 0;
        this.__queue = [];
    }
    
    length() {
    	return this.__queue.length;
    }
    
    /** @param { () => Promise<T> } func 
     * @template T
     * @returns {Promise<T>}
    */
    async enqueue(func) {
        if(++this.__active > this.maxSimultaneously) {
            await new Promise(resolve => this.__queue.push(resolve));
        }

        try {
        	console.log(`${this.name}: ${this.__active} active`);
            return await func();
        } catch(err) {
        	console.log(`${this.name}: ${err}`);
            throw err;
        } finally {
            this.__active--;
            if(this.__queue.length) {
                this.__queue.shift()();
            }
            console.log(`${this.name}: ${this.__active} active`);
        }
    }
}

module.exports = Queue;