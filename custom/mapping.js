const fs = require('fs');
const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);
exports.start = async (routeName, header, messageContainer, message) => {
    console.log(header);
    // Read JSON data from a file
    const userMap = new Map();
    const dataObj = {}
    const registerUsers = fs.readFileSync(`${CONSTANTS.ROOTDIR}/registerUser.json`, 'utf8');
    const token = fs.readFileSync(`${CONSTANTS.ROOTDIR}/token.json`, 'utf8');
    try {
        const data = JSON.parse(registerUsers);
        const admin_token= JSON.parse(token);
        message.content.token = crypt.decrypt(admin_token['admin_token']);
        for (const user in data) {
            userMap.set(data[user].id, 0);
            dataObj[data[user].id] = {name :data[user].name , email : user }
        }

    } catch (err) {
        console.log("Error parsing JSON string:", err);
    }
    const headers = ["Content-Type: application/json",
        `Authorization: ${message.content.token}`]
    header.flow.route1.headers = headers;
    message.env.map = userMap;
    message.env.dataObj = dataObj;
    message.addRouteDone(routeName);
    message.setGCEligible(true);
}