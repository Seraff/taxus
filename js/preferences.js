const DEFAULTS = {
  branchWidth: 1,
  branchColor: '#999'
}

class Preferences {
  constructor (a) {
    this.preferences = DEFAULTS
  }

  getPreferences () {
    return this.preferences
  }

  applyToDefaults (otherPreferences) {
    this.preferences = DEFAULTS

    for (var key in DEFAULTS) {
      if (hasOwnProperty(otherPreferences, key)) {
        this.preferences[key] = otherPreferences[key]
      }
    }

    return this.preferences
  }

  dispathPreferencesUpdate () {
    var event = new Event('preferences_update')
    document.dispatchEvent(event)
  }
}

module.exports = Preferences
