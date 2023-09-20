const {
    app,
    contextBridge,
    ipcRenderer
} = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        setTitle: (text) => ipcRenderer.send('taxus:set_title', text),

        openFileDialog: (options) => ipcRenderer.invoke('taxus:open_file_dialog', options),
        loadFile: (path) => ipcRenderer.invoke('taxus:load_file', path),
        saveFileDialog: (options) => ipcRenderer.invoke('taxus:save_file_dialog', options),
        saveFile: (path, content) => ipcRenderer.invoke('taxus:save_file', path, content),

        // OS: Open With -> Taxus
        handleOpenFile: (callback) => ipcRenderer.on('taxus:open_file', callback),
        windowIsReady: () => ipcRenderer.send('taxus:window_is_ready'),

        updateMenu: (states) => ipcRenderer.invoke('taxus:update_menu', states),
        onMenuClicked: (callback) => ipcRenderer.on('taxus:menu_clicked', callback),

        showProgressBar: () => ipcRenderer.send('taxus:show_progress_bar'),
        hideProgressBar: () => ipcRenderer.send('taxus:hide_progress_bar'),

        giveCurrentPrefs: () => ipcRenderer.send('taxus:give_current_prefs'),
        handleGiveCurrentPrefs: (callback) => ipcRenderer.on('taxus:give_current_prefs', callback),
        takeCurrentPrefs: (prefs) => ipcRenderer.send('taxus:take_current_prefs', prefs),
        handleTakeCurrentPrefs: (callback) => ipcRenderer.on('taxus:take_current_prefs', callback),
        takeNewPrefs: (prefs) => ipcRenderer.send('taxus:take_new_prefs', prefs),
        handleTakeNewPrefs: (callback) => ipcRenderer.on('taxus:take_new_prefs', callback),
        newPrefsTaken: () => ipcRenderer.send('taxus:new_prefs_taken'),
        closePrefWindow: () => ipcRenderer.send('taxus:close_pref_window'),

        openAnnotationWindow: (data) => ipcRenderer.send('taxus:open_annotation_window', data),
        handleTakeAnnotationData: (callback) => ipcRenderer.on('taxus:take_annotation_data', callback),
        applyNewAnnotation: (data) => ipcRenderer.send('taxus:apply_new_annotation', data),
        handleApplyNewAnnotation: (callback) => ipcRenderer.on('taxus:apply_new_annotation', callback),
        closeAnnotationWindow: (data) => ipcRenderer.send('taxus:close_annotation_window', data),

        copyText: (text) => ipcRenderer.send('taxus:copy_text', text),

        openAlertWindow: (options) => ipcRenderer.invoke('taxus:open_alert_window', options),

        closeWindow: () => ipcRenderer.send('taxus:close_window'),
        handleCloseWindow: (callback) => ipcRenderer.on('taxus:close_window', callback),
        quit: () => ipcRenderer.send('taxus:quit'),

        currentPlatform: () => process.platform
    }
);

contextBridge.exposeInMainWorld(
    "modules", {
        path: require("path"),
        underscore: function() {
            let _ = require('underscore')
            let methods = ['contains', 'keys', 'values', 'isUndefined',
                'findWhere', 'each', 'uniq', 'select',
                'indexOf', 'pluck', 'noop', 'pick']
            let result = {}
            methods.forEach((m) => {
                result[m] = _[m]
            })
            return result
        },
        xml2js: require('xml2js'),
        splitjs: require('split.js'),
        pako: require('pako'),
        svgToPng: require('save-svg-as-png')
    }
);
