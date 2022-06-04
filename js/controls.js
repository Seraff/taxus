class Controls {
    constructor() {
        this._items = {}

        this._menu_items = {}
    }

    register(system_id, menu_id, html_selector) {
        var item = new ControlItem(system_id, menu_id, html_selector)
        this._items[system_id] = item

        if (menu_id)
            this._menu_items[menu_id] = item

        return this
    }

    menuStateDict() {
        var result = {}

        Object.keys(this._items).forEach((key) => {
            var item = this._items[key]

            if (item.hasMenuEntry())
                result[item.menu_id] = item.enabled
        })

        return result
    }

    enableItem(system_id){
        if (system_id in this._items){
            this._items[system_id].enable()
        }
    }

    disableItem(system_id) {
        if (system_id in this._items) {
            this._items[system_id].disable()
        }
    }

    disableAll() {
        Object.keys(this._items).forEach((key) => {
            this._items[key].disable()
        })
    }

    runMenuCallback(menu_id) {
        if (menu_id in this._menu_items){
            console.log('run callback on ' + menu_id)
            this._menu_items[menu_id].runCallback()
        }
    }
}

class ControlItem {
    constructor(system_id, menu_id, html_selector) {
        this.system_id = system_id
        this.enabled = false

        this.menu_id = menu_id

        this.html_selector = html_selector

        if (this.html_selector){
            this.html_item = $(html_selector)
            this.html_item.on('click', () => {
                this.runCallback()
            })
        }
    }

    enable() {
        this.enabled = true
        this.enableHtmlItem()
    }

    disable() {
        this.enabled = false
        this.disableHtmlItem()
    }

    disableHtmlItem() {
        if (this.html_item)
            this.html_item.attr('disabled', 'disabled')
    }

    enableHtmlItem() {
        if (this.html_item)
            this.html_item.removeAttr('disabled')
    }

    hasMenuEntry() {
        return this.menu_id !== undefined
    }

    hasHtmlEntry() {
        return this.html_item !== undefined
    }

    // Runs systemNameAction() method in scripts.js
    runCallback() {
        if (this.system_id) {
            var func_name = toCamel(this.system_id + '-action')
            console.log('running callback ' + func_name)
            window[func_name]()
        }
    }
}
