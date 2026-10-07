import EmbeddedPostgres from 'embedded-postgres'
import fs from 'node:fs'
import path from 'node:path'

const dataDir = path.resolve(process.cwd(), '.pg/data')
const port = Number(process.env.DEV_PG_PORT ?? 5433)

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'claveria',
  password: 'claveria',
  port,
  persistent: true,
  onLog: () => {},
  onError: (msg) => console.error(String(msg)),
})

async function ensureDatabase(name: string) {
  try {
    await pg.createDatabase(name)
    console.log(`created database ${name}`)
  } catch (err) {
    if (!String(err).includes('already exists')) throw err
  }
}

async function main() {
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log('initialising embedded postgres in .pg/data')
    await pg.initialise()
  }
  await pg.start()
  await ensureDatabase('claveria_dev')
  await ensureDatabase('claveria_test')
  console.log(`postgres ready on 127.0.0.1:${port} (claveria_dev, claveria_test). Ctrl+C to stop.`)

  const stop = async () => {
    await pg.stop()
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
