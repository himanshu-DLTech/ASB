const fs = require('fs');
const path = require('path');
exports.start = async (routeName, headers, messageContainer, message) => {
    try {
        function cleanFolder(folderPath) {
            if (!fs.existsSync(folderPath)) {
                console.log(`The folder "${folderPath}" does not exist.`);
                return;
            }

            fs.readdirSync(folderPath).forEach(file => {
                const curPath = path.join(folderPath, file);
                fs.rmSync(curPath, { recursive: true, force: true });
            });
            console.log(`The folder "${folderPath}" has been cleaned.`);
        }
        const folderPath = `${CONSTANTS.ROOTDIR}/processing`;

        cleanFolder(folderPath);
    }
    catch (error) {
        console.log('[cleanUp] error :' + error);
    }
}