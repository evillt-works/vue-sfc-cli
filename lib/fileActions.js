const { logger, parseContent } = require('../utils')
const glob = require('glob')
const path = require('path')
const fs = require('fs-extra')
const _set = require('lodash.set')

module.exports = class FileActions {
  constructor(opts = {}) {
    this.opts = Object.assign({}, opts)

    this.templates = glob.sync(path.join(this.opts.templatesDir, '**'), {
      nodir: true,
      dot: true
    })
  }

  create() {
    this.templates.forEach(filepath => {
      const fileName = path.relative(this.opts.templatesDir, filepath)
      const target = path.join(this.opts.outDir, fileName)
      const content = parseContent(fs.readFileSync(filepath, 'utf8'), this.opts)

      fs.outputFileSync(target, content)

      logger.fileAction('magenta', 'Created', path.relative(process.cwd(), target))
    })
  }

  move(opts = {
    patterns: {}
  }) {
    Object.keys(opts.patterns).forEach(pattern => {
      const files = glob.sync(pattern, {
        cwd: this.opts.outDir,
        absolute: true
      })

      const from = files[0]
      const to = path.join(this.opts.outDir, opts.patterns[pattern])
      fs.moveSync(from, to, {
        overwrite: true
      })

      logger.fileMoveAction(from, to)
    })
  }

  upgrade(extraFiles = []) {
    const filesFromCli = this.opts.argv.get('files') || ''
    const { shouldUpdateFiles, setShellFilePermission } = require('../utils/update-files')

    const files = shouldUpdateFiles.concat(extraFiles, filesFromCli.split(','))

    const upgradeFiles = glob.sync(
      `*(${files.join('|')})`,
      {
        cwd: this.opts.templatesDir,
        nodir: true,
        dot: true,
        absolute: true
      }
    )

    upgradeFiles.forEach(filepath => {
      const fileName = path.relative(this.opts.templatesDir, filepath)
      const target = path.join(process.cwd(), fileName)
      const content = parseContent(fs.readFileSync(filepath, 'utf8'), this.opts)

      fs.outputFileSync(target, content)

      logger.fileAction('yellow', 'Upgraded', path.relative(process.cwd(), target))
    })

    setShellFilePermission(process.cwd())

    upgradePackageJson(
      // @ts-ignore
      Object.assign(
        this.opts,
        {
          source: fs.readFileSync(path.join(this.opts.templatesDir, '_package.json'), 'utf8')
        }
      )
    )
  }
}

function upgradePackageJson({ pkg, source, componentName, ownerName }) {
  const templatePkg = JSON.parse(parseContent(source, { componentName, ownerName }))
  const cliVersion = require('../package.json').version
  const currentPkg = pkg

  const properties = [
    // 保证 script[stdver,release] 都是来自模板
    {
      key: 'scripts',
      value: {
        stdver: templatePkg.scripts.stdver,
        release: templatePkg.scripts.release
      }
    },
    // 保证 devDependencies[@femessage/github-release-notes,standard-version] 都是来自模板
    {
      key: 'devDependencies',
      value: {
        '@femessage/github-release-notes': templatePkg.devDependencies['@femessage/github-release-notes'],
        'standard-version': templatePkg.devDependencies['standard-version']
      }
    },
    { key: 'husky' },
    { key: 'lint-staged' },
    { key: 'publishConfig' }
  ]

  currentPkg['vue-sfc-cli'] = cliVersion
  // gren
  currentPkg.gren = templatePkg.gren

  properties.forEach(prop => {
    // 以用户的 package.json 文件为基础，避免因合并后造成排序混乱导致 review 增加负担。
    Object.keys(pkg[prop.key] || templatePkg[prop.key]).forEach(k => {
      // 以顺序赋值
      _set(currentPkg, [prop.key, k], Object.assign(templatePkg[prop.key], pkg[prop.key])[k])
      // 处理必须值
      if (prop.value) {
        _set(currentPkg, prop.key, Object.assign(currentPkg[prop.key], prop.value))
      }
    })
  })

  fs.outputJSONSync(path.join(process.cwd(), 'package.json'), currentPkg, {
    spaces: 2
  })

  logger.fileAction('yellow', 'Upgraded', 'package.json')
}
