/* 
 * (C) 2015 - 2018 TekMonks. All rights reserved.
 */
const os = require("os");
const mustache = require("mustache"); 
const fs = require('fs');

function getDateTime() {

    const date = new Date();

    let hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    let min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    let sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    const year = date.getFullYear();

    let month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    let day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return `${year}:${month}:${day}:${hour}:${min}:${sec}`;
}

function getTimeStamp() {
    let hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
}

function getObjectKeyValueCaseInsensitive(obj, key) {
    for (const keyThis of Object.keys(obj)) if (keyThis.toUpperCase() == key.toUpperCase()) return obj[keyThis];
    return null;
}

function expandProperty(property, flow, message) {
    const data = {esb: global.ESB, ...flow, ...message, constants: global.CONSTANTS, ESB_DIR: CONSTANTS.ROOTDIR, process: global.process};
    return mustache.render(property, data);
}

function clone(object, skipProperties=[]) {
    if (!skipProperties.length) return JSON.parse(JSON.stringify(object));

    const clone = {}; for (const key in object) if (!skipProperties.includes(key)) clone[key] = JSON.parse(JSON.stringify(object[key]));
    return clone;
}

function getReport(){
    const reportFile = `${CONSTANTS.ROOTDIR}/report.json`;
    const reportData = fs.readFileSync(reportFile);
    const jsonData = JSON.parse(reportData);
    return jsonData;
}

function getRegisterUsers(){
    const registered = `${CONSTANTS.ROOTDIR}/registerUser.json`;
    const userData = fs.readFileSync(registered);
    const users = JSON.parse(userData);
    return users;
}

function mantisActivityScore(id, message , change) {
    try {
        const validActivities = ['New Issue', 'Status', 'Assigned To', 'Issue Monitored', 'Issue End Monitor', 'Project', 'File Added', 'Note Added', 'Resolution' ,'Severity Changed','Priority Changed'];
        const userData = fs.readFileSync(`${CONSTANTS.ROOTDIR}/registerUser.json`);
        const users = JSON.parse(userData);
        const user = Object.values(users).find(user => user.id === id);  
        if (!user) return 0;  
        const role = user.role;
        if (!validActivities.includes(message)) return 0;    
        switch (message) {
            case 'Status':
                return (change === 'resolved => closed' && (role !== 'dev' && role !== 'dba')) ? 2 : 1;
            case 'File Added':
                return 2;
            case 'New Issue':
                return (role !== 'dev' && role !== 'dba') ? 2 : 1;
            case 'Project':
                return (role !== 'dev' && role !== 'dba') ? 2 : 1;
            case 'Resolution':
                return (role === 'dev' || role === 'dba') ? 2 : 1;
            default:
                return 1;
        }
    } catch (error) {
        console.log(`[count activity] error is ` + error);
    }
    
}

function getWeekRange(dateString) {
    const date = new Date(dateString);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() - 1);
    
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    
    const startDay = startDate.getDate();
    const startMonth = months[startDate.getMonth()];
    const endDay = endDate.getDate();
    const endMonth = months[endDate.getMonth()];
    const year = endDate.getFullYear();
    
    if (startMonth !== endMonth) {
      return `(${startDay} ${startMonth} - ${endDay} ${endMonth}, ${year})`;
    } else {
      return `(${startDay} - ${endDay} ${endMonth}, ${year})`;
    }
}

const getTempFile = ext =>
    `${os.tmpdir()+"/"+(Math.random().toString(36)+'00000000000000000').slice(2, 11)}.${getTimeStamp()}${ext?`.${ext}`:""}`;

module.exports = { mantisActivityScore,getDateTime,getReport,getWeekRange,getRegisterUsers,  getTimeStamp, getObjectKeyValueCaseInsensitive, expandProperty, getTempFile, clone };
