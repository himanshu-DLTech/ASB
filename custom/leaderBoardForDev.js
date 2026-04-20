const fs = require('fs');
exports.start = async (routeName, result, messageContainer, message) => {
  try {

    // Load the JSON data from the file
    const reportFile = `${CONSTANTS.ROOTDIR}/report.json`;
    const reportData = fs.readFileSync(reportFile);
    const jsonData = JSON.parse(reportData);

    // Get today's date
    const today = new Date();

    const weekReport = {};
    const lastWeekReport = {};

    // Iterate over the past week
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = formatDate(date);

      if (jsonData[formattedDate]) {
        for (const key in jsonData[formattedDate]) {
          if (!weekReport[key]) {
            weekReport[key] = 0;
          }
          weekReport[key] += jsonData[formattedDate][key];
        }
      }
    }


    // Print the result
    console.log('week report .......' + JSON.stringify(weekReport));

    for (let i = 7; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = formatDate(date);

      if (jsonData[formattedDate]) {
        for (const key in jsonData[formattedDate]) {
          if (!lastWeekReport[key]) {
            lastWeekReport[key] = 0;
          }
          lastWeekReport[key] += jsonData[formattedDate][key];
        }
      }
    }

    console.log('last week report .....' + JSON.stringify(lastWeekReport));



    const percentageChange = calculatePercentageChange(weekReport, lastWeekReport);
    console.log(percentageChange);

    const registered = `${CONSTANTS.ROOTDIR}/registerUser.json`;
    const userData = fs.readFileSync(registered);
    const users = JSON.parse(userData);

    // Create the result array
    const weekReportOfRegisteredUsers = [];

    // Populate the weekReportOfRegisteredUsers array with the required fields
    for (const email in users) {
      const userInfo = users[email];
      if (userInfo.role.toString() == "Dev" || userInfo.role.toString() == "Dba") {
        const userId = userInfo.id.toString();  // Convert ID to string to match the keys in weekReport
        if (weekReport.hasOwnProperty(userId)) {
          weekReportOfRegisteredUsers.push({
            name: userInfo.name,
            email: email,
            count: weekReport[userId],
            efficiency: percentageChange[userId]
          });
        }
      }
    }

    weekReportOfRegisteredUsers.sort((a, b) => b.count - a.count);

    // Add rank attribute based on sorted order
    const leaderBoard = weekReportOfRegisteredUsers.map((employee, index) => ({
      ...employee,
      rank: index + 1,
      isFirst: index === 0
    }));

    message.content.leaderBoard = leaderBoard;
    //calculating week range
    message.content.weekRange = getWeekRange(today);
    message.env.weekRange = message.content.weekRange;

    message.addRouteDone(routeName);
    message.setGCEligible(true);
  }
  catch (error) {
    console.log('[leaderBoard] error :' + error);
  }
}


function getWeekRange(dateString) {
  const date = new Date(dateString);

    // Calculate the end date (one day before today)
    const endDate = new Date(date);
    endDate.setDate(date.getDate() - 1);
    
    // Calculate the start date (7 days before the end date)
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    
    // Get the day, month, and year for the start and end dates
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const startMonth = months[startDate.getMonth()];
    const startYear = startDate.getFullYear();
    const endMonth = months[endDate.getMonth()];
    const endYear = endDate.getFullYear();
    
    // Format the range as "DD - DD Month YYYY"
    return `${startDay} ${startMonth} ${startYear}  - ${endDay} ${endMonth} ${endYear}`;
}

// Function to format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

function calculatePercentageChange(currentWeek, lastWeek) {
  const result = {};

  for (const id in currentWeek) {
    if (lastWeek.hasOwnProperty(id)) {
      const current = currentWeek[id];
      const previous = lastWeek[id];
      let percentageChange;

      if (previous === 0) {
        percentageChange = current === 0 ? 0 : 100;
      } else {
        percentageChange = ((current - previous) / previous) * 100;
      }

      result[id] = percentageChange.toFixed(2);
    } else {
      result[id] = 'N/A';
    }
  }

  for (const id in lastWeek) {
    if (!currentWeek.hasOwnProperty(id)) {
      result[id] = 'N/A';
    }
  }

  return result;
}

