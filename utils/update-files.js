const fs = require('fs-extra')
const path = require('path')

const shellFiles = [
  'build.sh',
  'netlify.sh',
  'notify.sh'
]

exports.shouldUpdateFiles = [
  '.grenrc.js',
  '.prettierrc',
  '.stylelintrc',
  '.travis.yml',
  ...shellFiles
]

exports.setShellFilePermission = dir => {
  shellFiles.forEach(shellFile => {
    fs.chmodSync(path.join(dir, shellFile), '755')
    fs.chmodSync(path.join(dir, shellFile), '755')
    fs.chmodSync(path.join(dir, shellFile), '755')
  })
}
