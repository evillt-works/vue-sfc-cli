const fs = require('fs-extra')
const path = require('path')

const shellFiles = [
  'build.sh',
  'netlify.sh',
  'notify.sh'
]

exports.todoFiles = [
  {
    fileName: 'build.sh',
    msg: 'Please check `yarn build` in `build.sh`'
  },
  {
    fileName: '.travis.yml',
    msg: 'Please check `deploy` in `.travis.yml`'
  },
  {
    fileName: 'netlify.sh',
    msg: 'Please check `yarn doc` in `netlify.sh`(you can delete this file if you don\'t need it)'
  },
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
