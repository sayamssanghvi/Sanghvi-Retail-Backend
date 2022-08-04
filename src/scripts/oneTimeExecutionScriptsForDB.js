let fsp = require('fs/promises');
const path = require('path');
const { resolve } = require('path');
let { OneTimeExecutionScriptsForDB } = require('../models/OneTimeExecutionScriptsForDB');
var IsNullOrUndefined = require('../utilities/nullCheck');

let oneTimeExecutionScriptsForDB = new Promise(async (resolve, reject) => {
    
    var dir = await fsp.readdir('./src/db/oneTimeExecutionScripts');            
    var scriptsInDB = await OneTimeExecutionScriptsForDB.find();
    if (scriptsInDB.length == 0)
        await ExecuteAll(dir,scriptsInDB);
    else
        await ExecuteOnlyNewScripts(dir,scriptsInDB);
    resolve();
});

async function ExecuteAll(dir, scriptsInDB) {

    let baseUrl = path.resolve('./src/db/oneTimeExecutionScripts');
    let scriptExecuted = [];
    let scriptNotExecuted=[]
    for (var value of dir) {
        await ExecuteSingleScript(baseUrl, value, scriptExecuted, scriptNotExecuted);
    }
    if (scriptExecuted.length == dir.length)
        console.log(`All ${scriptExecuted.length} Scripts Executed`);
    else
        console.log(`${scriptNotExecuted.length} Scripts Not Executed = ${scriptNotExecuted}`);
    
    return new Promise((resolve,reject) => {
        resolve();
    });
}

async function ExecuteOnlyNewScripts(dir, scriptsInDB) {
    
    let baseUrl = path.resolve('./src/db/oneTimeExecutionScripts');
    let scriptExecuted = [];
    let scriptNotExecuted = [];
    let scriptPreExecuted = [];
    for (var fileName of dir) {
        
        if (scriptsInDB.find(value => value.scriptName == fileName.toLowerCase()))
            scriptPreExecuted.push(fileName.toLowerCase());
        else
            await ExecuteSingleScript(baseUrl, fileName, scriptExecuted, scriptNotExecuted);
    }
        
    console.log(`${scriptPreExecuted.length} scripts pre Executed = ${scriptPreExecuted}`);
    console.log(`${scriptExecuted.length} scripts Executed = ${scriptExecuted}`);
    console.log(`${scriptNotExecuted.length} scripts not Executed = ${scriptNotExecuted}`);
}

async function ExecuteSingleScript(baseUrl, value, scriptExecuted, scriptNotExecuted) {
 
    let filePath = baseUrl + '/' + value;
    let scriptSuccess = await require(filePath);
    if (scriptSuccess) {
        let script = new OneTimeExecutionScriptsForDB({
            scriptName: value
        });
        let result = await script.save();
        if (!IsNullOrUndefined(result.id))
            scriptExecuted.push(value);
        else
            scriptNotExecuted.push(value);
    } else {
        scriptNotExecuted.push(value);
    }
    return new Promise((resolve,reject) => {
        resolve();
    });
}

module.exports = {
    oneTimeExecutionScriptsForDB
}