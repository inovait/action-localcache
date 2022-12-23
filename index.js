const core = require('@actions/core');
import { download } from "progressive-downloader";
const path = require("path");
const exec = require('@actions/exec');

async function main() {
    try {
        const key = core.getInput('key');
        const folder = core.getInput('folder');
        console.log(`Loading cache ${key} into ${folder}!`);

        var cacheHit = false;
        try {
            await download(
                [
                    {
                        url: `http://build-docker-linux:25478/files/${key}.tar?token=tqLbfObO8fHMRYeDZqTT`,
                        path: "cache.tar",
                    }
                ],
                (
                    progress,
                    speed // called once per second while downloading
                ) => console.log(`cache download ${progress * 100}% complete at ${speed} MB/s`),
                (
                    _current,
                    _total // called every time a file download completes
                ) => { }
            );
            cacheHit = true;
        } catch (notFoundError) {
            console.log(`Cache entry for key ${key} missing`)
        }

        if (cacheHit) {
            await exec.exec(`ls -la /root`);
            const parentFolder = path.resolve(folder, '..');

            await exec.exec(`mkdir -p ${parentFolder}`);
            await exec.exec(`tar -xf cache.tar -C ${parentFolder}`);    
            await exec.exec(`ls -la /root`);
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

main();