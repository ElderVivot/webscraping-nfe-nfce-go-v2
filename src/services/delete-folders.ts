import { promises as fs } from 'fs'
// import { tmpdir } from 'os'
import path from 'path'
import rimraf from 'rimraf'
import util from 'util'

const rimrafAsync = util.promisify(rimraf)

export async function DeleteFolder (directory: string, nameFolder: string, deleteAllThisName = false): Promise<void> {
    try {
        if (!deleteAllThisName) await rimrafAsync(path.join(directory, nameFolder))
        else {
            const listOfFilesOrFolders = await fs.readdir(directory)
            for (const fileOrFolder of listOfFilesOrFolders) {
                if (fileOrFolder.toLowerCase().indexOf(nameFolder) < 0) continue
                const pathDirectory = path.resolve(directory, fileOrFolder)
                const statusOfDirectory = await fs.stat(pathDirectory)
                if (statusOfDirectory.isDirectory()) {
                    await rimrafAsync(pathDirectory)
                } else {
                    continue
                }
            }
        }
    } catch (error) {
        console.log('- Error ao delete folders: ', error)
    }
}

// DeleteFolder(tmpdir(), 'puppeteer_dev_chrome', true).then(_ => console.log(_))