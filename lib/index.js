const GistClient = require('gist-client');
const gistClient = new GistClient();
const CSON = require('cson');
const fs = require('fs');
const chalk = require('chalk');

const logError = (err) => {
    console.log(chalk.red(err));
};

const logSuccess = (info) => {
    console.log(chalk.green(info));
};
const logWelcome = (info) => {
    console.log(chalk.inverse.underline.bold(info));
};

module.exports = (username, token, folderId, path) => {

    const SNIPPET_TYPE = {
        MARKDOWN: 'MARKDOWN_NOTE',
        SNIPPET: 'SNIPPET_NOTE'
    };

    const FILE_LANGUAGE = {
        MARKDOWN: 'Markdown',
        TEXT: 'text'
    };

    if (typeof username !== 'string') {
        return Promise.reject(new TypeError('Expected a string for username')).then(function () {
        }, function () {
            logError('Expected a string for username');
        });
    } else if (!username || username === '') {
        return Promise.reject(new Error('Username not defined')).then(function () {
        }, function () {
            logError('Username not defined');
        });
    }

    if (typeof token !== 'string') {
        return Promise.reject(new TypeError('Expected a string for token')).then(function () {
        }, function () {
            logError('Expected a string for token');
        });
    } else if (!token || token === '') {
        return Promise.reject(new Error('Token not defined')).then(function () {
        }, function () {
            logError('Token not defined');
        });
    }

    // Save CSON file to out folder.
    const saveCsonFileToDisk = (fileName, fileContent) => {
        return new Promise((resolve, reject) => {
            const outFolder = `${path}/out`;
            if (!fs.existsSync(outFolder)) {
                fs.mkdirSync(outFolder);
            }
            fs.writeFile(`${outFolder}/${fileName}.cson`, fileContent, function (err) {
                if (err) {
                    return reject(`${fileName}.cson file is NOT saved. Error : \n ${err.message}`);
                }
                logSuccess(`${fileName}.cson file is saved successfully.`);
                resolve();
            });
        });
    };

    // Set CSON format from JSON file.
    const prepareCsonFormatFromJson = (gist) => {
        const files = gist.files;
        let snippets = [];
        let isMarkdown = true;
        let firstFilesName;
        for (let fileName in files) {
            const fileObject = files[fileName];

            firstFilesName = firstFilesName ? firstFilesName : fileName;
            const fileLanguage = fileObject.language !== null ? fileObject.language : FILE_LANGUAGE.TEXT;
            let snippet = {
                name: fileName,
                mode: fileLanguage,
                content: fileObject.content
            };
            snippets.push(snippet);
            isMarkdown = fileObject.language === FILE_LANGUAGE.MARKDOWN && isMarkdown;
        }

        let snippetType;
        if (isMarkdown && Object.keys(files).length <= 1)
            snippetType = SNIPPET_TYPE.MARKDOWN;
        else
            snippetType = SNIPPET_TYPE.SNIPPET;

        let title;
        if (gist.description !== '') {
            title = gist.description;
        } else if (firstFilesName && firstFilesName !== '') {
            title = firstFilesName;
        } else {
            title = `No Title - ${gist.id}`;
        }
        let description = gist.description === '' ? `No Description - ${gist.id}` : gist.description;

        const findTagInString = (string) => {
            let array = string.split(' ');
            array = array.filter((object) =>
                object.indexOf('#') !== -1);
            array = array.map((item) => {
                return item.replace(/#/g, '');
            });
            return array;
        };

        let tags;
        if (gist.description && gist.description !== '') {
            tags = findTagInString(gist.description);
            tags = tags.length > 0 ? tags : [];
        } else {
            tags = [];
        }

        return {
            createAt: gist.created_at,
            updateAt: gist.updated_at,
            type: snippetType,
            folder: folderId,
            title: title,
            description: description,
            snippets: snippets,
            tags: tags,
            isStarred: false,
            isTrashed: false
        };
    };

    // Create CSON file from Gist JSON.
    const createCsonFile = (gist) => {
        return new Promise((resolve, reject) => {
            const csonFormatObject = prepareCsonFormatFromJson(gist);
            return CSON.createCSONString(csonFormatObject, {}, function (err, result) {
                if (err) {
                    return reject(`An error occurred when JSON file converting to CSON file. Error : \n ${err}`);
                }
                resolve(result);
            })
        });
    };

    // This request because of the contents not coming with gistList.
    // Get each gist with content.
    const getGistObject = (gistId) => {
        return gistClient.getOneById(gistId);
    };

    // Get all gist
    const start = () => {
        logWelcome('.............................Started...................................');

        gistClient.getAll({ filterBy: [{ userName: username }] })
            .then((gistList) => {
                const loop = gistList.map((_gistObject) => {
                    return new Promise(async (resolve) => {
                        const gistId = _gistObject.id;
                        const gistObject = await getGistObject(gistId);
                        const csonFile = await createCsonFile(gistObject);
                        await saveCsonFileToDisk(gistId, csonFile);
                        resolve();

                    });
                });
                Promise.all(loop).then(() => {
                    logWelcome('Job finish with successfully.');
                });

            })
            .catch((err) => {
                logError(`An error occurred. Error : \n ${err}`);
            });
    };

    gistClient.setToken(token);
    start();
};