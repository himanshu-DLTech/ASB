const utils = require(`${CONSTANTS.LIBDIR}/utils.js`);
exports.start = async (routeName, update, messageContainer, message) => {
    try {
        console.log(update);
        const usersMap = message.env.map;
        // Get individual date components
        const today = new Date();
        today.setDate(today.getDate() - 1); // Subtract one day

        const year = today.getFullYear();
        const month = today.getMonth() + 1; // Months are zero-based, so add 1
        const day = today.getDate();

        // Format the date as a string
        const todayDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let todayHistory = [];
        const Issues = message.content.data.issues;
        Issues.forEach(issue => {
            if (issue.updated_at.split('T')[0] == todayDate) {
                todayHistory = issue.history;
                todayHistory.forEach(history => {
                    if (history.created_at.split('T')[0] == todayDate) {
                        let score = utils.mantisActivityScore(history.user.id, history.message.split(':')[0],history.change);
                        if (score === 'undefined')
                            throw "mantis activity score is undefind";
                        usersMap.forEach((value, key) => {
                            // if (!usersMap.has(history.user.id)) {
                            //     usersMap.set(history.user.id, score);
                            // }
                            if (key === history.user.id) { // count even person is not registered
                                usersMap.set(key, value + score);
                            }
                        });
                    }
                });
            }
        });
        console.log(todayHistory);
        usersMap.forEach((value, key) => {
            console.log(`${key}: ${value}`);
        });
        message.env.map = {};
        message.env.map = usersMap;
        message.content.todayDate = todayDate;
        message.addRouteDone(routeName);
        message.setGCEligible(true);
    } catch (error) {
        console.error('An error occurred:', error);
    }
};
