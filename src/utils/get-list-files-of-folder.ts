import { promises as fs } from 'fs'
import path from 'path'

export async function listFiles (directory: string, files: Array<string> = []): Promise<string[]> {
    if (!files) { files = [] }

    const listOfFiles = await fs.readdir(directory)
    for (const k in listOfFiles) {
        const pathDirectory = path.resolve(directory, listOfFiles[k])
        const stat = await fs.stat(pathDirectory)
        if (stat.isDirectory()) {
            await listFiles(pathDirectory, files)
        } else {
            files.push(pathDirectory)
        }
    }

    return files
}