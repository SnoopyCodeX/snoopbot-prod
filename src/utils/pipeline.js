const pipeline = (pipes, ...args) => {
	const callbacks = pipes
	    .slice()
	    .reverse()
	    .reduce(
            (next, pipe) => 
                (...args) => 
		            typeof pipe(next) === "function"
		                ? pipe(next)(...args)
		                 : pipe(...args),
		    (n) => n
		);
		    
    return callbacks(...args);    
};

module.exports = pipeline;