exports.vueSfcCli = (value, cliVersion) => {
  // 兼容旧的 cli 版本
  // vue-sfc-cli: x.x.x
  if (typeof value === 'string') {
    return {
      createVersion: value,
      updateVersion: cliVersion,
    }
  }

  return {
    ...value,
    updateVersion: cliVersion,
  }
}
