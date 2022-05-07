'use strict';

module.exports = init;

function init(projectName, options, cmdObj) {
    console.log('init', projectName, cmdObj.parent._optionValues);
}
