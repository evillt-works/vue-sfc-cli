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
    const { shouldUpdateFiles, setShellFilePermission, todoFiles } = require('../utils/update-files')

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

    console.log()
    todoFiles.forEach(todoFile => logger.todo(todoFile.msg))
    logger.info('After double-check, you should run `yarn` or `npm i` to install the injected devDependencies.')
  }
}

function upgradePackageJson({ pkg, source, componentName, ownerName }) {
  const templatePkg = JSON.parse(parseContent(source, { componentName, ownerName }))
  const cliVersion = require('../package.json').version
  const currentPkg = pkg

  const properties = [
    // 保证 scripts[stdver,release] 都是来自模板
    {
      key: 'scripts',
      overrideValue: {
        stdver: templatePkg.scripts.stdver,
        release: templatePkg.scripts.release
      },
      fallbackValue: {
        test: 'echo "Info: no test specified"'
      }
    },
    // 保证 devDependencies[@femessage/github-release-notes,standard-version] 都是来自模板
    {
      key: 'devDependencies',
      overrideValue: {
        '@femessage/github-release-notes': templatePkg.devDependencies['@femessage/github-release-notes'],
        'standard-version': templatePkg.devDependencies['standard-version']
      }
    }
  ]

  _set(currentPkg, 'vue-sfc-cli', cliVersion)
  // gren 以用户的 gren 优先
  _set(currentPkg, 'gren', currentPkg.gren || templatePkg.gren)
  // publishConfig.asscess = 'public'
  _set(currentPkg, ['publishConfig', 'access'], templatePkg.publishConfig.access)

  properties.forEach(prop => {
    // {}, 预防的字段，用户的字段，最终保证的字段
    _set(currentPkg, prop.key, Object.assign({}, prop.fallbackValue, currentPkg[prop.key], prop.overrideValue))

    // 以用户的 package.json 文件为基础，避免因合并后造成排序混乱导致 review 增加负担。
    Object.keys(pkg[prop.key]).forEach(k => {
      // 以顺序赋值
      _set(currentPkg, [prop.key, k], Object.assign({}, templatePkg[prop.key], pkg[prop.key])[k])
    })
  })

  fs.outputJSONSync(path.join(process.cwd(), 'package.json'), currentPkg, {
    spaces: 2
  })

  logger.fileAction('yellow', 'Upgraded', 'package.json')
}
