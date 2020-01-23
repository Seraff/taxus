const DEFAULTS = {
  branchWidth: 2,
  branchColor: '#999'
}

class Preferences {
  constructor () {
    this.preferences = DEFAULTS
  }

  getPreferences () {
    return this.preferences
  }

  getPreference (key) {
    return this.preferences[key]
  }

  applyToDefaults (otherPreferences) {
    this.preferences = DEFAULTS
    this.applyToCurrent(otherPreferences)

    return this.preferences
  }

  applyToCurrent (otherPreferences){
    for (var key in DEFAULTS) {
      if (hasOwnProperty(otherPreferences, key)) {
        this.preferences[key] = this.formatPreference(key, otherPreferences[key])
      }
    }

    this.dispathPreferencesUpdate()
    return this.preferences
  }

  dispathPreferencesUpdate () {
    var event = new Event('preferences_update')
    document.dispatchEvent(event)
  }

  formatPreference (key, value) {
    if (key == 'branchColor' && value[0] != '#' ) { return "#" + value }
    return value
  }

  forNexus () {
    var result = {}
    for (var key in this.getPreferences()) {
      var val = this.getPreferences()[key]

      if (typeof val === 'string') { val = this.getPreferences()[key].replace(/\#/g, '') }

      result[key] = val
    }

    return result
  }
}

module.exports = Preferences
