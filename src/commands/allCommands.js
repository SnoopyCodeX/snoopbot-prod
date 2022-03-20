const fs = require("fs");

const getAllCommands = (excludedFiles = []) => {
  let files = {};
  
  fs.readdirSync(__dirname).forEach(function(file) {
    if (file.match(/\.js$/) !== null && !excludedFiles.includes(file)) {
      const name = file.replace('.js', '');
      files[name] = require('./' + file);
    }
  });
  
  return files;
}

module.exports = getAllCommands([
  'allCommands.js',
  'play-old.js'
]);