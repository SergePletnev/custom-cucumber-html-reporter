'use strict'

const fs = require('fs');

function getStepColor(step) {
    let cssClass;
    switch (step.result.status) {
        case 'passed':
            cssClass = 'btn-success';
            break;
        case 'failed':
            cssClass = 'btn-danger';
            break;
        case 'skipped':
            cssClass = 'btn-warning';
            break;
    }
    return cssClass;
}

function generateHtmlForFeature(jsonData) {
    let reportFillingHtml = '';
    let featureIndex = 0;
    jsonData.forEach((feature) => {
        reportFillingHtml = reportFillingHtml + `<button type="button" class="btn btn-primary btn-block" data-toggle="collapse" data-target="#feature${featureIndex}"><strong>Feature:</strong> ${feature.name}</button>
        <div id="feature${featureIndex}" class="collapse">${generateScenarioHtml(feature.elements, featureIndex)}</div>`;
        featureIndex++;
    });
    return reportFillingHtml;
}

function generateScenarioHtml(scenarioArray, featureIndex) {
    let scenarioHtml = '';
    let scenarioIndex = 0;
    scenarioArray.forEach((scenario) => {
        scenarioHtml = scenarioHtml + `<button type="button" class="btn btn-info btn-block" data-toggle="collapse" data-target="#feature${featureIndex}scenario${scenarioIndex}"><strong>Scenario:</strong> ${scenario.name}
        </button>
        <div id=feature${featureIndex}scenario${scenarioIndex} class="collapse">${generateStepsHtml(scenario.steps, scenario.name)}</div>`;
        scenarioIndex++;
    });
    return scenarioHtml;
}

function generateStepsHtml(stepsArray, scenarioName) {
    let stepsHtml = '';
    stepsArray.forEach((step) => {
        if (step.keyword !== 'After') {
            stepsHtml = stepsHtml + `<button type="button" class="btn ${getStepColor(step)} btn-block"><strong>${step.keyword}</strong> ${step.name}</button>`;
        }
        else {
            if (step.embeddings !== undefined) {
                let image = new Buffer.from(step.embeddings[0].data, 'base64');
                fs.existsSync('screenshots') || fs.mkdirSync('screenshots');
                let screenshotPath = './screenshots/' + scenarioName.replace(/\s/g, '') + '.png';
                fs.writeFileSync(screenshotPath, image, 'base64');
                stepsHtml = stepsHtml + `<img src='${screenshotPath}'>`;
            }
        }
    });
    return stepsHtml;
}

function generate(options) {
    const reportHeader = `<!DOCTYPE html>
    <html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
    </head>
    <body>`;

    const reportEnd = `</body></html>`;

    const reportJson = JSON.parse(fs.readFileSync(options.jsonFile));

    let finalHtml = reportHeader + generateHtmlForFeature(reportJson) + reportEnd;
    fs.writeFileSync(options.output, finalHtml.toString(), 'utf8');
}

module.exports = {
    generate: generate
};