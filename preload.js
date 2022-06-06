const {
    app,
    contextBridge,
    ipcRenderer
} = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        // TODO: remove send/receive
        send: (channel, data) => {
            ipcRenderer.send(channel, data)
        },
        receive: (channel, func) => {
            ipcRenderer.on(channel, (event, ...args) => func(...args))
        },

        openFileDialog: (options) => ipcRenderer.invoke('taxus:open_file_dialog', options),
        loadFile: (path) => ipcRenderer.invoke('taxus:load_file', path),
        saveFileDialog: (options) => ipcRenderer.invoke('taxus:save_file_dialog', options),
        saveFile: (path, content) => ipcRenderer.invoke('taxus:save_file', path, content),

        updateMenu: (states) => ipcRenderer.invoke('taxus:update_menu', states),
        onMenuClicked: (callback) => ipcRenderer.on('taxus:menu_clicked', callback)
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
        pako: require('pako')
    }
);
