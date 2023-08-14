const Module = require('module')
const originalRequire = Module.prototype.require
const hookModuleToReturnMockFromRequire = (module, mock) => {
  Module.prototype.require = function () {
    if (arguments[0] === module) {
      return mock
    }
    return originalRequire.apply(this, arguments)
  }
}

const resetModuleMocks = () => {
  Module.prototype.require = originalRequire
}

module.exports = {
  hook: hookModuleToReturnMockFromRequire,
  reset: resetModuleMocks
}
