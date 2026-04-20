const fs = require('fs').promises;

exports.start = async (routeName, update, messageContainer, message) => {
    try {
        console.log(update);

        // Convert the map to an object
        const mapObject = Object.fromEntries(message.env.map);

        // Create a JSON object with today's date as the key
        const jsonObject = {
            [message.content.todayDate]: mapObject
        };

        // Read the existing data from the file
        let fileData = {};
        try {
            const data = await fs.readFile(`${CONSTANTS.ROOTDIR}/report.json`, 'utf8');
            fileData = JSON.parse(data);
        } catch (err) {
            if (err.code !== 'ENOENT') { // Ignore file not found errors
                throw err;
            }
        }

        // Append the new data to the existing data
        fileData = { ...fileData, ...jsonObject };

        // Convert the updated data to a JSON string
        const jsonString = JSON.stringify(fileData, null, 2);

        // Write the updated JSON string to the file
        await fs.writeFile(`${CONSTANTS.ROOTDIR}/report.json`, jsonString);
        console.log('JSON file has been updated and saved.');
        message.addRouteDone(routeName);
        message.setGCEligible(true);
        messageContainer.add(message);
    } catch (error) {
        console.error('An error occurred:', error);
    }
};
