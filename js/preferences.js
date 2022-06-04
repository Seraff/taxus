class Preferences {
  static DEFAULTS = {
    branchWidth: 2,
    branchColor: '#303030',
    displayAlignmentCoverage: 'true',
    displayBootstrap: 'true',
    taxaFontFamily: 'Sans-serif',
    taxaFontSize: '12',
    taxaFontBold: 'false',
    taxaFontItalic: 'true',
    taxaFontUnderline: 'false'
  }

  constructor () {
    this.preferences = {}
    this.resetToDefaults()
  }

  getPreferences () {
    return this.preferences
  }

  getPreference (key) {
    var val = this.preferences[key]
    return ['true', 'false'].includes(val) ? (val === 'true' ? true : false) : val
  }

  resetToDefaults () {
    for (var key in Preferences.DEFAULTS) {
      this.preferences[key] = Preferences.DEFAULTS[key]
    }
  }

  applyToDefaults (otherPreferences) {
    this.resetToDefaults()
    this.applyToCurrent(otherPreferences)

    return this.preferences
  }

  applyToCurrent (otherPreferences){
    for (var key in Preferences.DEFAULTS) {
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
