const fs = require('fs');
const utils = require(CONSTANTS.LIBDIR + "/utils.js");
exports.start = async (routeName, result, messageContainer, message) => {
  try {
    message.logsMsg = message.content; 
    message.content = {}; 
    message.content.html = message.logsMsg; 
    delete message.logsMsg; 
    message.content.title = '🔔 Server Password Update Confirmation'
    const users = utils.getRegisterUsers();
    const emailList = [];

    // Populate the monthReportOfRegisteredUsers array with the required fields
    for (const email in users) {
        const userInfo = users[email];
        if(userInfo.role.toString() == "Dev" || userInfo.role.toString() == "Manager"){
            emailList.push(email);
        }
    }
    message.content.to=emailList;
    message.addRouteDone(routeName);
    message.setGCEligible(true);
  }
  catch (error) {
    console.log('[serverPasswordReminder] error :' + error);
  }
}