import * as exec from '@actions/exec'
import path from 'path'
import * as core from '@actions/core'
import expandTilde = require('expand-tilde')
import fs from 'fs'
import fetch from 'node-fetch'

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

    const res = await fetch(`http://build-docker-linux:25478/cache/${repo}/${key}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (res.status === 404) {
      console.log(`Cache entry for key ${key} missing. Skipping...`)
    } else if (res.status === 200) {
      const body = res.body
      if (body == null) {
        core.setFailed('Failed to fetch data')
        return
      }

      const fileStream = fs.createWriteStream('cache.tar')
      await new Promise((resolve, reject) => {
        body.pipe(fileStream)
        body.on('error', reject)
        fileStream.on('finish', resolve)
      })

      const parentFolder = path.resolve(folder, '..')

      await exec.exec(`mkdir -p ${parentFolder}`)
      try {
        await exec.exec(`taar -xf cache.tar -C ${parentFolder}`)
      } catch (e) {
        console.warn(e)
        core.warning('Cache unpacking failed. Was the archive corrupted? Continuing without cache...')
      }
    } else {
      core.setFailed(`Failed to load cache entry - ${res.status} ${res.statusText}`)
      return
    }
  } catch (error: any) {
    console.log(error)
    core.setFailed(error.message)
  }
}

void main()
