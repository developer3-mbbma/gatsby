const Telemetry = require(`./telemetry`)
const flush = require(`./flush`)

const instance = new Telemetry()

process.on(`exit`, flush)

// For longrunning commands we want to occasinally flush the data
// The data is also sent on exit.
const interval = 10 * 60 * 1000 // 10 min

const tick = _ => {
  flush()
    .catch(console.error)
    .then(_ => setTimeout(tick, interval))
}

module.exports = {
  trackCli: (input, tags) => instance.captureEvent(input, tags),
  trackError: (input, tags) => instance.captureError(input, tags),
  trackBuildError: (input, tags) => instance.captureBuildError(input, tags),
  setDefaultTags: tags => instance.decorateAll(tags),
  decorateEvent: (event, tags) => instance.decorateNextEvent(event, tags),
  setTelemetryEnabled: enabled => instance.setTelemetryEnabled(enabled),
  startBackgroundUpdate: _ => {
    setTimeout(tick, interval)
  },

  expressMiddleware: source => (req, res, next) => {
    try {
      instance.trackActivity(`${source}_ACTIVE`)
    } catch (e) {
      // ignore
    }
    next()
  },
}
