const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);
const fs = require('fs');

exports.start = async (routeName, header, _, message) => {
    const token = fs.readFileSync(`${CONSTANTS.ROOTDIR}/token.json`, 'utf8');
    const admin_token= JSON.parse(token);
    message.content.token = crypt.decrypt(admin_token['admin_token']);
    const headers = ["Content-Type: application/json",
        `Authorization: ${message.content.token}`]
    header.flow.route1.headers = headers;
    message.content = {};
    message.addRouteDone(routeName);
    message.setGCEligible(true);
}