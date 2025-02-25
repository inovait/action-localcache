import * as exec from '@actions/exec'
import path from 'path'
import * as core from '@actions/core'
import fetch from 'node-fetch'
import { spawn } from 'node:child_process'
import expandTilde = require('expand-tilde')

async function main (): Promise<void> {
  try {
    if (!core.getBooleanInput('restore')) {
      console.log('Restore disabled. Skipping this step...')
      return
    }

    const key = core.getInput('key', { required: true })
    const rawFolder = core.getInput('folder', { required: true })
    const folder = expandTilde(rawFolder)

    const repo = core.getInput('repo', { required: true })
    const token = core.getInput('token', { required: true })

    console.log(`Loading cache ${key} into ${folder}!`)

    const parentFolder = path.resolve(folder, '..')

    await exec.exec(`mkdir -p ${parentFolder}`)

    // We must use regular node spawn instead of actions.exec due to https://github.com/actions/toolkit/issues/649
    const tarProcess = spawn('tar', ['-xf', '-', '-C', parentFolder])

    const res = await fetch(`http://build-docker-linux:25478/cache/${repo}/${key}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      highWaterMark: 1024 * 1024
    })

    if (res.status === 404) {
      console.log(`Cache entry for key ${key} missing. Skipping...`)
      tarProcess.kill()
    } else if (res.status === 200) {
      const body = res.body
      if (body == null) {
        core.setFailed('Failed to fetch data')
        tarProcess.kill()
        return
      }

      await new Promise((resolve, reject) => {
        body.pipe(tarProcess.stdin)
        body.on('error', reject)
        body.on('finish', resolve)
      })

      await new Promise((resolve) => {
        tarProcess.on('exit', (code) => {
          resolve(code)
        })
      })
    } else {
      core.setFailed(`Failed to load cache entry - ${res.status} ${res.statusText}`)
      tarProcess.kill()
      return
    }
  } catch (error: any) {
    console.log(error)
    core.setFailed(error.message)
  }
}

void main()
