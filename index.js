const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const deepEqual = require('fast-deep-equal');
const winston = require('winston')
//const sheetsy = require('sheetsy');
const { getWorkbook, getSheet } = require(`./sheetsy.js`);

const sheetURL = process.env.GSHEET_URL;
const defaultRefreshInterval = 30000;
const refreshInterval = Number(process.env.REFRESH_INTERVAL) || defaultRefreshInterval;

var oldData = {};

app.set('port', (process.env.PORT || 3000));

const urlToKey = (url) => {
		return firstCapture(/key=(.*?)(&|#|$)/, url)
			|| firstCapture(/d\/e\/(.*?)\/pubhtml/, url)
			|| firstCapture(/spreadsheets\/d\/e\/(.*?)\//, url)
			|| toss(`No key found in ${ url }`)
	}

const firstCapture = (regex, str) => {
	const match = regex.exec(str)
	return match && match[1]
}

const toss = message => {
    winston.log('info', 'message ' + message);
}
const getSheetData = async function getSheetData(sheetKey) {
  try {
    winston.log('info', 'getSheetData start');
    //2PACX-1vR7WSkWAMn-MpPTkmlkO61t9v-dfAmBJ83O7jmZ7Ex69WT1US9CTpjDrHt_DVBEGr6gwKO7gb5ETZ6G
    //14uk6kljx-tpGJeObmi22DkAyVRFK5Z1qKmSXy1ewuHs
    //getWorkbook('14uk6kljx-tpGJeObmi22DkAyVRFK5Z1qKmSXy1ewuHs').then(workbook => {
	//    const firstRow = sheet.rows[0]
      //const wbName = workbook.name 
      //winston.log('info', 'wbName ' + wbName);// => {
//		name: 'Sheetsy test',
//		authors: [
//			{
//				name: 'joshduffman',
//				email: 'joshduffman@gmail.com',
//			}
//		],
//		updated: '2017-07-14T04:59:24.123Z',
//		sheets: [
//			{ name: 'Herp', id: 'od6', updated: '2017-07-14T04:59:24.123Z' },
//			{ name: 'Derp', id: 'of6b9b5', updated: '2017-07-14T04:59:24.123Z' }
//		]
//	}
//});
    
    winston.log('info', 'getSheetData start 2');
    //const workbookObject = await getWorkbook('14uk6kljx-tpGJeObmi22DkAyVRFK5Z1qKmSXy1ewuHs');
    //winston.log('info', 'workbookObject ' + workbookObject.name);
    
    //const sheetIds = workbookObject.sheets.map((sheetObject) => {
    //  return sheetObject.id;
    //});
    //winston.log('info', 'sheetIds ' + sheetIds);

    // aggregatedData becomes an array of promises because it's async    
// which is necessary to call the async getSheet function within it
    
const aggregatedData = await getSheet('14uk6kljx-tpGJeObmi22DkAyVRFK5Z1qKmSXy1ewuHs', 'abc');
//aggregatedData.map((row) => {
//        winston.log(`${row[0]}, ${row[4]}`);
//      });
//    const aggregatedData = sheetIds.map(async (sheetId) => {
//      const sheetData = await getSheet('14uk6kljx-tpGJeObmi22DkAyVRFK5Z1qKmSXy1ewuHs', sheetId);
//      return sheetData;
//    })

//  winston.log('info', 'aggregatedData ' + JSON.stringify(aggregatedData));

    // We then use Promise.all to return when all the child promises have resolved
    //return Promise.all(aggregatedData)
    return aggregatedData;
  } catch (e) {
    winston.log('error', e);
  }
}

const cleanSheetData = async function(data) {
  //Return an object with individual sheet data keyed to their name
  const cleanData = data.reduce((object, sheet) => {

    const headerRow = sheet.rows[0];
    // This array should include only the gSheet column names...
    const sheetColumnNames = Object.keys(headerRow);
    // ...but, for reasons I don't understand there's twice the number of keys
    // needed so we find the length of the array and shave the first half off
    const relevantLength = sheetColumnNames.length / 2;
    const trueColumnNames = sheetColumnNames.slice(relevantLength);

    // Now reduce through the rows to create an array of row objects
    const rowArray = sheet.rows;
    const restructuredRows = rowArray.reduce((object, row, index) => {

      // Create an object for each row where the
      // values are keyed to column headers
      const keyedRow = row.reduce((object, cell, index) => {
        const columnNameFromIndex = trueColumnNames[index];
        object[columnNameFromIndex] = cell;
        return object;
      }, {});

      object.push(keyedRow);
      return object;
    }, []);

    object[sheet.name] = restructuredRows;
    return object;
  }, {});

  return cleanData;
};

// Push results to clients
const pushDataToClient = function pushDataToClient(data) {
  io.emit('data', data);
  winston.log('info', 'Pushed to client');
};

const getAndPushData = async function getAndPushData(sheetKey) {
  try {
    const newData = await getSheetData(sheetKey);
    //winston.log('info', newData);
    //const cleanData = await cleanSheetData(newData);

    // TODO: Fix the weird double negative here
    const dataUnchanged = deepEqual(oldData, newData);
    if (!dataUnchanged) {
     //winston.log('info', 'start_ ' + JSON.stringify(newData));
     winston.log('info', 'end_ ');
     winston.log('info', 'end_ ');

     winston.log('info', 'oldData: ' + oldData.results.length + 'newData: ' + newData.results.length);
     var oldDataEntries = Object.keys(oldData).length;
     var newDataEntries = Object.keys(newData).length;
     //var oldResults = oldData['oldResults'];
     //var newResults = newData['newResults'];
    var oldResults = [];
    for(var i in oldData)
    	oldResults.push([i, oldData [i]]);

    var newResults = [];
    for(var i in newData)
    	newResults.push([i, newData [i]]);
	    
     winston.log('info', 'oldResults: ' + oldResults.length + 'newResults: ' + newResults.length);
     winston.log('info', 'oldDataEntries: ' + oldDataEntries + 'newDataEntries: ' + newDataEntries);
      winston.log('info', 'Data changed');
      pushDataToClient(newData);
      oldData = newData;
    } else {
      winston.log('info', 'Data unchanged');
      return;
    }
  } catch (e) {
    winston.log('error', e);
  }
}

setInterval(() => {
  try {
    const sheetKey = urlToKey(sheetURL);
    //const key = urlToKey('https://docs.google.com/spreadsheets/d/14uk6kljx-tpGJeObmi22DkAyVRFK5Z1qKmSXy1ewuHs/pubhtml');
    winston.log('info', 'sheetURL ' + sheetURL);
    winston.log('info', 'sheetKey ' + sheetKey);
    //winston.log('info', 'key ' + key);
    getAndPushData(sheetKey);
  } catch (e) {
    throw (e);
  };
}, refreshInterval)

// Push data to newly connected users
io.on('connection', function(socket){
  socket.emit('data', oldData);
  winston.log('info', 'Client connected, data pushed')
});

// Return 404 for all requests to the server
app.get('/', (req, res) => {
  res.sendStatus(404);
})

// Start the server
http.listen(app.get('port'), () => {
  winston.log('info', 'App started.')
});
