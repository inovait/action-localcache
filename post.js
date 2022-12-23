const core = require('@actions/core');
const exec = require('@actions/exec');
const FormData = require('form-data');
const fs = require('fs');
import fetch from 'node-fetch';
const path = require("path");

async function main() {
    try {
        const key = core.getInput('key');
        const folder = core.getInput('folder');

        console.log("Compressing cache...")
        const parentFolder = path.resolve(folder, '..');
        const folderName= path.basename(folder);
        await exec.exec(`tar -cf cache.tar -C ${parentFolder} ${folderName}`);

        console.log("Uploading cache...")

        const formData = new FormData()
        formData.append('file', fs.createReadStream("cache.tar"))
        const a = `http://build-docker-linux:25478/files/${key}.tar?token=tqLbfObO8fHMRYeDZqTT`;
        console.log(`Uploading '${a}'`)
        const r = await fetch(`http://build-docker-linux:25478/files/${key}.tar?token=tqLbfObO8fHMRYeDZqTT`, {
            method: 'PUT',
            body: formData,
            headers: formData.getHeaders()
        });
        const res = await r.text();
        if (!res.includes('"ok":true')) {
            core.setFailed(res);
            return
        }

        console.log(`Post cache ${key} into ${folder}!`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

main();