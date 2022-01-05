import fs from 'fs'
import util from 'util'

const copyFileAsync = util.promisify(
    (src: fs.PathLike, dest: fs.PathLike, cb: fs.NoParamCallback) => fs.copyFile(
        src, dest, (err) => cb(err)
    )
)

export { copyFileAsync }

// fs.copyFile('C:/_temp/certificados/helismar.pfx', 'C:/_temp/certificados/teste/helismar.pfx',
//     (err) => console.log(err)
// )