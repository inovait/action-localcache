import fetch from 'node-fetch'

import path from 'path'
import fs from 'fs'
import FormData from 'form-data'
import * as exec from '@actions/exec'
import * as core from '@actions/core'
import expandTilde = require('expand-tilde')

async function main (): Promise<void> {
  try {
    const key = core.getInput('key')
    const rawFolder = core.getInput('folder')
    const folder = expandTilde(rawFolder)

    console.log('Compressing cache...')
    const parentFolder = path.resolve(folder, '..')
    const folderName = path.basename(folder)
    await exec.exec(`tar -cf cache.tar -C ${parentFolder} ${folderName}`)

    console.log('Uploading cache...')

    const formData = new FormData()
    formData.append('file', fs.createReadStream('cache.tar'))
    const a = `http://build-docker-linux:25478/files/${key}.tar?token=tqLbfObO8fHMRYeDZqTT`
    console.log(`Uploading '${a}'`)
    const r = await fetch(`http://build-docker-linux:25478/files/${key}.tar?token=tqLbfObO8fHMRYeDZqTT`, {
      method: 'PUT',
      body: formData,
      headers: formData.getHeaders()
    })
    const res = await r.text()
    if (!res.includes('"ok":true')) {
      core.setFailed(res)
      return
    }

    console.log(`Post cache ${key} into ${folder}!`)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

void main()
