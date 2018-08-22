'use strict';

const yargs = require('yargs').argv;
const reporter = require('./lib/reporter');

function generateReport(options) {
    return reporter.generate(options);
}

const pathToReport = (yargs.path) ? yargs.path : './reports/report_epam.json' ;
let options = {
    jsonFile: pathToReport,
    output: './reports/custom_cucumber_report.html'
};

generateReport(options);