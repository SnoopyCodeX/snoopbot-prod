const fs = require("fs");
const configs = require("../../configs");

const openPermissions = () => JSON.parse(fs.readFileSync(configs.APP_PERMISSION_FILE, {encoding: "utf8"}));
const savePermissions = (permissions) => fs.writeFileSync(
  configs.APP_PERMISSION_FILE,
  JSON.stringify(permissions, null, 4),
  {encoding: "utf8"}
);

const getAdminsFromThread = (threadID) => {
  let allThreadAdmins = openPermissions()["thread-admins"];
  let threadAdmins = allThreadAdmins[threadID] || [];
  let botOwner = openPermissions()["bot-owner"];
  
  if(threadAdmins.length === 0)
    return {
      message: "This thread has no administrators for this chatbot.",
      hasError: true,
      botOwner
    };
    
  return {
    admins: threadAdmins,
    botOwner,
    hasError: false
  };
};

const addAdminsInThread = (threadID, ...newAdmins) => {
  let allThreadAdmins = openPermissions();
  let alreadyAdmins = [];
  
  if(allThreadAdmins["thread-admins"][threadID] === undefined)
    allThreadAdmins["thread-admins"][threadID] = [];
  
  if(allThreadAdmins["thread-admins"][threadID].length > 0) {
    let admins = allThreadAdmins["thread-admins"][threadID];
    
    for(let admin of newAdmins)
      if(admins.includes(admin))
        alreadyAdmins.push(admin);
        
    if(alreadyAdmins.length > 0)
      return {
        alreadyAdmins,
        hasError: true
      };
  }
    
  allThreadAdmins["thread-admins"][threadID].push(...newAdmins);
  savePermissions(allThreadAdmins);
  return { hasError: false };
};

const removeAdminsInThread = (threadID, ...adminsToRemove) => {
  let allThreadAdmins = openPermissions();
  let notAdmins = [];
  
  if(allThreadAdmins["thread-admins"][threadID] === undefined || allThreadAdmins["thread-admins"][threadID].length === 0)
    return {
      message: "This thread has no administrators in chatbot to remove",
      hasError: true
    };
  
  if(allThreadAdmins["thread-admins"][threadID].length > 0) {
    let admins = allThreadAdmins["thread-admins"][threadID];
    
    for(let admin of adminsToRemove)
      if(!admins.includes(admin))
        notAdmins.push(admin);
        
    if(notAdmins.length > 0)
      return {
        notAdmins,
        hasError: true
      };
  }
  
  let admins = allThreadAdmins["thread-admins"][threadID];
  adminsToRemove.forEach((admin) => admins.splice(admins.indexOf(admin), 1));
  
  allThreadAdmins["thread-admins"][threadID] = admins;
  
  // If current thread has no more admins left, delete the thread id from the list 
  if(allThreadAdmins["thread-admins"][threadID].length === 0)
    delete allThreadAdmins["thread-admins"][threadID];
  
  savePermissions(allThreadAdmins);
  
  return { hasError: false };
};

const listAdminsInThread = (threadID) => {
  let allThreadAdmins = openPermissions();
  let admins = allThreadAdmins["thread-admins"][threadID];
  
  if(admins === undefined || admins.length === 0)
    return {
      message: "This thread has no administrators for this chatbot",
      hasError: true
    };
    
  return {
    admins,
    hasError: false
  };
};

module.exports = {
  getAdminsFromThread,
  addAdminsInThread,
  removeAdminsInThread,
  listAdminsInThread
};