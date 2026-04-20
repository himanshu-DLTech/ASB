const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);

exports.start = async (routeName, header, _, message) => {
    const headers = ["Content-Type: application/json",
        `Authorization: ${crypt.decrypt(message.content.token)}`]
        
    header.flow.route1.headers = headers;
    message.env.to = message.content.email;
    message.env.datatowrite = message.content;
    message.content = {};
    message.addRouteDone(routeName);
    message.setGCEligible(true);
}