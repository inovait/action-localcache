import fetch from 'node-fetch'

import path from 'path'
import fs from 'fs'
import * as exec from '@actions/exec'
import * as core from '@actions/core'
import expandTilde = require('expand-tilde')

async function main (): Promise<void> {
  try {
    if (!core.getBooleanInput('save')) {
      core.debug('Save disabled. Skipping this step...')
      return
    }

    const key = core.getInput('key', { required: true })
    const rawFolder = core.getInput('folder', { required: true })
    const folder = expandTilde(rawFolder)

    const repo = core.getInput('repo', { required: true })
    const token = core.getInput('token', { required: true })

    console.log('Compressing cache...')
    const parentFolder = path.resolve(folder, '..')
    const folderName = path.basename(folder)
    try {
      await exec.exec(`tar -cf cache.tar -C ${parentFolder} ${folderName}`)
    } catch (e) {
      console.warn(e)
      core.warning('Cache packing failed. Is the cached folder missing?')
      return
    }

    console.log('Uploading cache...')

    const authorization = `Bearer ${token}`

    const res = await fetch(`http://build-docker-linux:25478/cache/${repo}/${key}`, {
      method: 'PUT',
      body: fs.createReadStream('cache.tar'),
      headers: {
        Authorization: authorization
      }
    })

    await res.buffer()

    if (res.status !== 200) {
      core.setFailed(`Failed to load cache entry - ${res.status} ${res.statusText}`)
      return
    }

    console.log(`Post cache ${key} into ${folder}!`)
  } catch (error: any) {
    console.log(error)
    core.setFailed(error)
  }
}

void main()
