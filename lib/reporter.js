'use strict'

const fs = require('fs');
const path = require('path');

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
    let featuresHtml = '';
    let featureIndex = 0;
    jsonData.forEach((feature) => {
        featuresHtml = featuresHtml + `<button type="button" class="btn btn-primary btn-block" data-toggle="collapse" data-target="#feature${featureIndex}">
        <span class="highlight">Feature:</span> ${feature.name}<span class="time">${getFeatureDuration(feature)}s</span></button>
        <div id="feature${featureIndex}" class="collapse">${generateScenarioHtml(feature.elements, featureIndex)}</div>`;
        featureIndex++;
    });
    return featuresHtml;
}

function getFeatureDuration(feature) {
    let duration = 0;
    feature.elements.forEach((scenario) => {
        duration += getScenarioDuration(scenario);
    });
    return Number(duration).toFixed(3);
}

function generateScenarioHtml(scenarioArray, featureIndex) {
    let scenarioHtml = '';
    let scenarioIndex = 0;
    scenarioArray.forEach((scenario) => {
        scenarioHtml = scenarioHtml + `<button type="button" class="btn btn-info btn-block" data-toggle="collapse" data-target="#feature${featureIndex}scenario${scenarioIndex}">
        <span class="highlight">Scenario:</span>${scenario.name}<span class="time">${getScenarioDuration(scenario)}s<span></button>
        <div id=feature${featureIndex}scenario${scenarioIndex} class="collapse">${generateStepsHtml(scenario.steps, scenario.name)}</div>`;
        scenarioIndex++;
    });
    return scenarioHtml;
}

function getScenarioDuration(scenario) {
    let duration = 0;
    scenario.steps.forEach((step) => {
        if (typeof step.result.duration === 'number') {
            duration += step.result.duration;
        }
    });
    return duration / 1000;
}

function generateStepsHtml(stepsArray, scenarioName) {
    let stepsHtml = '';
    stepsArray.forEach((step) => {
        if (step.keyword !== 'After') {
            stepsHtml += `<button type="button" class="btn ${step.result.status} btn-block"><strong>${step.keyword}</strong> ${step.name}`;
            if (typeof step.result.duration === 'number') {
                stepsHtml += `<span class="time">${step.result.duration / 1000}s<span></button>`;
            } else {
                stepsHtml += '</button>'
            }
        }
        else {
            if (step.embeddings !== undefined) {
                let image = new Buffer.from(step.embeddings[0].data, 'base64');
                fs.existsSync(path.resolve('./reports/screenshots')) || fs.mkdirSync(path.resolve('./reports/screenshots'));
                let screenshotPath = path.resolve('./reports/screenshots/' + scenarioName.replace(/\s/g, '') + '.png');
                fs.writeFileSync(screenshotPath, image, 'base64');
                stepsHtml += '<a class="toggle" href="#">Screenshot -</a>';
                stepsHtml = stepsHtml + `<img src="${screenshotPath}">`;
            }
        }
    });
    return stepsHtml;
}

function getStatistics(jsonData) {
    let statistics = {
        scenariosPassed: 0,
        scenariosFailed: 0
    };
    jsonData.forEach((feature) => {
        feature.elements.forEach((scenario) => {
            let passed = true;
            scenario.steps.forEach((step) => {
                if (step.result.status === 'failed') {
                    passed = false;
                }
            })
            if (passed) {
                statistics.scenariosPassed += 1;
            } else {
                statistics.scenariosFailed += 1;
            }
        })
    })
    return statistics;
}

function generate(options) {
    const reportHeader = `<!DOCTYPE html>
    <html>
    <head>
    <title>Custom Cucumber HTML Reporter</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <link rel="stylesheet" href="./css/demo.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
    </head>
    <body>`;

    const reportEnd = `</body></html>`;

    const reportJson = JSON.parse(fs.readFileSync(options.jsonFile));
    const statistics = getStatistics(reportJson);

    const headerPanel = `<div class="navbar navbar-default navbar-static-top" role="navigation">
    <div class="container">
      <div class="navbar-header">
        <a class="navbar-brand">Custom Cucumber Report</a>
        <div class="label-container">
          <span class="label label-success" title="scenarios passed" >Passed: ${statistics.scenariosPassed}</span>
          <span class="label label-danger" title="scenarios failed">Failed: ${statistics.scenariosFailed}</span>
        </div>
      </div>
    </div>
    </div>`

    let finalHtml = reportHeader + headerPanel + generateHtmlForFeature(reportJson) + reportEnd;

    fs.writeFileSync(options.output, finalHtml.toString(), 'utf8');
}

module.exports = {
    generate: generate
};