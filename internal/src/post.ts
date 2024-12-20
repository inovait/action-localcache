import fetch from 'node-fetch'

import path from 'path'
import * as core from '@actions/core'
import { spawn } from 'node:child_process'
import expandTilde from 'expand-tilde'

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

    console.log('Compressing and Uploading cache...')
    const parentFolder = path.resolve(folder, '..')
    const folderName = path.basename(folder)

    // We must use regular node.spawn instead of actions exec due to https://github.com/actions/toolkit/issues/649
    const tarProcess = spawn('tar', ['-cf', '-', '-C', parentFolder, folderName])

    const authorization = `Bearer ${token}`

    const resPromise = fetch(`http://build-docker-linux:25478/cache/${repo}/${key}`, {
      method: 'PUT',
      body: tarProcess.stdout,
      headers: {
        Authorization: authorization
      },
      highWaterMark: 1024 * 1024
    })

    await new Promise((resolve) => {
      tarProcess.on('exit', (code) => {
        resolve(code)
      })
    })

    const res = await resPromise
    await res.arrayBuffer()

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
