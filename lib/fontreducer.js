const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

let margin;

async function processXML(filePath) {
    const data  = fs.readFileSync(filePath, 'utf8');

    const result = await xml2js.parseStringPromise(data);
    // Traverse the XML and modify the font size
    traverseAndModify(result);

    const builder = new xml2js.Builder();
    const newXml = builder.buildObject(result);

    fs.writeFileSync(filePath, newXml);
    console.log(`Modified font size in ${filePath}`);
}

function traverseAndModify(node) {
    if (typeof node === 'object' && node !== null) {
        for (let key in node) {
            if (key === 'w:sz' || key === 'w:szCs') {
                const sizeElement = node[key][0];
                if (sizeElement && sizeElement['$'] && sizeElement['$']['w:val']) {
                    const currentSize = parseInt(sizeElement['$']['w:val']);
                    const newSize = Math.max(1, Math.floor(currentSize * margin)); // Ensure size does not go below 1
                    sizeElement['$']['w:val'] = newSize.toString();
                }
            }
            if (typeof node[key] === 'object') {
                traverseAndModify(node[key]);
            }
        }
    }
}

async function traverseDirectory(directory) {
    try{
        const files = fs.readdirSync(directory);

        for (const file of files) {
            const fullPath = path.join(directory, file);

            const stats = fs.statSync(fullPath)

            if (stats.isDirectory()) {
                await traverseDirectory(fullPath);
            } else if (path.extname(fullPath) === '.xml') {
                await processXML(fullPath);
            }
        }
    }catch(err){ LOG.error(`${err.message}`); return }
}

async function reduceFonts(xmlPath, fontMarzin){
    if(!fontMarzin || fontMarzin == "100") return; // no need to reduce
    fontMarzin = parseInt(fontMarzin)*0.01; margin = fontMarzin;
    await traverseDirectory(xmlPath);
}

module.exports={reduceFonts};