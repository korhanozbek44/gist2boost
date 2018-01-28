#!/usr/bin/env node

const program = require('commander');
const { prompt } = require('inquirer');
const chalk = require('chalk');

const questions = [
    {
        type: 'input',
        name: 'username',
        message: 'Enter username of Gist account ... :'
    },
    {
        type: 'input',
        name: 'token',
        message: 'Enter token from getting Github setting page ... :'
    },
    {
        type: 'input',
        name: 'folderId',
        message: 'Enter folderId which is getting from Boostnote setting page ... :'
    }
];

program
    .version('1.0.0', '-v, --version')
    .description('Download gist note which is type of compability boostnote.')
    .command('start')
    .alias('s')
    .action(() => {
        console.log(chalk.inverse('\n',
            '*-**-**-**-**-**-**-**-**-** \n',
            '*       gist2boostnote     * \n',
            '*   Author : Korhan ÖZBEK  * \n',
            '*-**-**-**-**-**-**-**-**-** \n'));

        prompt(questions)
            .then((answers) => {
                require('../lib/index')(answers.username, answers.token, answers.folderId, process.cwd());
            })
            .catch((err) => {
                console.log(chalk.red(`An error occurred. Error : \n ${err}`));
            });
    });

program
    .command('*')
    .action(function () {
        program.help();
    });

program.on('--help', function(){
    console.log('  Examples:');
    console.log('');
    console.log('    start');
    console.log('    Enter username of Gist account ...: Korhan');
    console.log('    Enter token from getting Github setting page ... : 123123123as11221123');
    console.log('    Enter folderId which is getting from Boostnote setting page ... : 810399827466b78ecf03');
    console.log('');
});

program.parse(process.argv);
if (!program.args.length) program.help();