const logger = require('./logger')
const rs = require('./replace-string')

exports.logger = logger

exports.pascalify = pascalify

exports.kebabcasify = kebabcasify

exports.parseContent = (content, { componentName, ownerName }) => {
  return rs(content, {
    componentNamePascal: pascalify(componentName),
    componentName: kebabcasify(componentName),
    ownerName,
    ownerNameLowerCase: ownerName.toLowerCase(),
    cliVersion: require('../package.json').version,
    licenseYear: new Date().getFullYear()
  })
}

function kebabcasify(content) {
  return content
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function pascalify(content) {
  const camelized = content.replace(/-([a-z])/g, c => c[1].toUpperCase())
  return camelized.charAt(0).toUpperCase() + camelized.slice(1)
}
