import { download } from 'progressive-downloader'
import * as exec from '@actions/exec'
import path from 'path'
import * as core from '@actions/core'
import expandTilde = require('expand-tilde')

async function main (): Promise<void> {
  try {
    const key = core.getInput('key')
    const rawFolder = core.getInput('folder')
    const folder = expandTilde(rawFolder)

    console.log(`Loading cache ${key} into ${folder}!`)

    let cacheHit = false
    try {
      await download(
        [
          {
            url: `http://build-docker-linux:25478/files/${key}.tar?token=tqLbfObO8fHMRYeDZqTT`,
            path: 'cache.tar'
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
      )
      cacheHit = true
    } catch (notFoundError) {
      console.log(`Cache entry for key ${key} missing`)
    }

    if (cacheHit) {
      await exec.exec('ls -la /root')
      const parentFolder = path.resolve(folder, '..')

      await exec.exec(`mkdir -p ${parentFolder}`)
      await exec.exec(`tar -xf cache.tar -C ${parentFolder}`)
      await exec.exec('ls -la /root')
    }
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

void main()
