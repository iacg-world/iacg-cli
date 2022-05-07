'use strict';


const Package = require('@iacg-cli/package')

function exec() {
    console.log('exec', process.env.CLI_TARGET_PATH);
    const pkg = new Package()
}

module.exports = exec;
