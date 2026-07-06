#!/usr/bin/env node

import { spawn } from 'node:child_process'
import fs from 'node:fs'

const env = { ...process.env }

// Al arrancar en producción: aplicar migraciones. Seed automático solo en SQLite nuevo.
if (process.argv.slice(-3).join(' ') === 'npm run start') {
  await exec('npx prisma migrate deploy')
  const url = process.env.DATABASE_URL
  if (url?.startsWith('file:')) {
    const fileUrl = new URL(url)
    const target = fileUrl.pathname
    const newDb = target && !fs.existsSync(target)
    if (newDb) await exec('tsx prisma/seed.ts')
  }
}

// launch application
await exec(process.argv.slice(2).join(' '))

function exec(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} failed rc=${code}`))
      }
    })
  })
}
