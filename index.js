'use strict';

var reporter = require('./lib/reporter');

function generateReport(options, callback) {
    return reporter.generate(options, callback);
}

module.exports = {
    generate: generateReport
};