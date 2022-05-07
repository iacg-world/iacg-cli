'use strict';

module.exports = exec;

function exec() {
    console.log('exec', process.env.CLI_TARGET_PATH);
}
