var fs = require('fs');
var _ = require('underscore');
var Promise = require('bluebird');

var utils = require('./utils/utils');
var HrStopwatch = require('./utils/hr-stopwatch');

var Excel = require('../excel');
var Workbook = Excel.Workbook;
var WorkbookWriter = Excel.stream.xlsx.WorkbookWriter;

if (process.argv[2] == 'help') {
    console.log("Usage:");
    console.log("    node testBigBookOut filename count writer strings styles");
    console.log("Where:");
    console.log("    writer is one of [stream, document]");
    console.log("    strings is one of [shared, own]");
    console.log("    styles is one of [styled, plain]");
    process.exit(0);
}

var filename = process.argv[2];
var count = process.argv.length > 3 ? parseInt(process.argv[3]) : 1000;
var writer = process.argv.length > 4 ? process.argv[4] : "stream";
var strings = process.argv.length > 5 ? process.argv[5] : "own";
var styles = process.argv.length > 6 ? process.argv[6] : "styled";

var useStream = (writer === "stream");

var options = {
    writer: (useStream ? "stream" : "document"),
    filename: filename,
    useSharedStrings: (strings === "shared"),
    useStyles: (styles === "styled")
};
console.log(JSON.stringify(options, null, "  "));

var stopwatch = new HrStopwatch();
stopwatch.start();

var wb = useStream ? new WorkbookWriter(options) : new Workbook();
var ws = wb.addWorksheet("blort");

var fonts = {
    arialBlackUI14: { name: "Arial Black", family: 2, size: 14, underline: true, italic: true },
    comicSansUdB16: { name: "Comic Sans MS", family: 4, size: 8, underline: "double", bold: true }
};

ws.columns = [
    { header: "Col 1", key:"key", width: 25 },
    { header: "Col 2", key:"name", width: 32 },
    { header: "Col 3", key:"age", width: 21 },
    { header: "Col 4", key:"addr1", width: 18 },
    { header: "Col 5", key:"addr2", width: 8 },
    { header: "Col 6", key:"num1", width: 8 },
    { header: "Col 7", key:"num2", width: 8 },
    { header: "Col 8", key:"num3", width: 32, style: { font: fonts.comicSansUdB16 } },
    { header: "Col 9", key:"date", width: 12 },
    
];

ws.getRow(1).font = fonts.arialBlackUI14;

var t1 = 0;
var t2 = 0;
var t2s = [];
var sw = new HrStopwatch();
var today = (new Date()).getTime();
for (var i = 0; i < count; i++) {
    sw.start();
    var row = ws.addRow({
        key: i,
        name: utils.randomName(5),
        age: utils.randomNum(100),
        addr1: utils.randomName(16),
        addr2: utils.randomName(10),
        num1: utils.randomNum(10000),
        num2: utils.randomNum(100000),
        num3: utils.randomNum(1000000),
        date: new Date(today + i * 86400000)
    });
    var lap = sw.span;
    row.commit();
    var end = sw.span;
    
    t1 += lap;
    t2 += (end - lap);
    t2s.push(Math.round((end - lap)*1000000));
}
console.log("addRow avg " + (t1 * 1000000 / count) + "\xB5s");
console.log("commit avg " + (t2 * 1000000 / count) + "\xB5s");
sw.start();
(useStream ? wb.commit() : wb.xlsx.writeFile(filename, options))
    .then(function(){
        console.log("Commit/writeFile: " + sw);
        stopwatch.stop();        
        console.log("Done.");
        console.log("Time: " + stopwatch);
    })
    .catch(function(error) {
        console.log(error.message);
    });
