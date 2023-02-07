class Element {
    constructor(el, parent) {
        this.children = []
        if (el) {
            this.$el = el
            this.setParent(parent)
        }
    }
    init() {
        this._uid = 0
    }
    appendChild(child) {
        this.children.push(child)
        child.setParent(this)
        return child
    }
    setParent(parent) {
        if (this.$parent) {
            return
        }
        this.$parent = parent
        if (parent == null) {
            this._uid = 0
        } else {
            this._uid = parent.uid + parent.size + 1
        }
    }

    get size() {
        return this.children.length
    }
    get uid() {
        return this._uid
    }
    get prevSibling() {
        if (this.$parent.size == 1) return null
        let index = this.$parent.children.indexOf(this)
        if (index == 0) return null
        return this.$parent.children[index - 1]
    }

    getChildren() {
        return this.children
    }
    forEach(f) {
        return this.getChildren().forEach(f)
    }

    get nextSibling() {
        let size = this.$parent.size
        if (size == 1) return null
        let index = this.$parent.children.indexOf(this)
        if (index == size - 1) return null
        return this.$parent.children[index + 1]
    }
    get siblings() {
        let parent = this.$parent
        if (!parent) return []
        const f = (x) => x != this
        return parent.children.filter(f)
    }
    get lastChild() {
        return this.children && this.children[this.size - 1]
    }

    get firstChild() {
        return this.children && this.children[0]
    }
    get root() {
        let root = this
        while (this.$parent) {
            root = this.$parent
        }
        return root
    }
}
class DomTree {
    constructor() {
        this.debug = true
        //this.debug = false
        this.root = new ECElement(firstElement())
        const runner = (el) => {
            if (this.debug) console.log(el.getInfo())
            forEach(el.$el, (child) => {
                const childElement = new ECElement(child)
                el.appendChild(childElement)
                runner(childElement)
            })
        }
        runner(this.root)
    }
    forEach(x, depth = 1) {
        function runner(el, depthIndex = 0) {
            el.forEach((child) => {
                if (depthIndex == depth) {
                    isObject(x) ?
                        addElementProperties(child.$el, x) :
                        x(child.$el, child)

                } else if (depthIndex > depth) {
                    return
                }
                runner(child, depthIndex++)
            })
        }
        runner(this.root)
    }
}

function forEach(el, f) {
    Array.from(elementGetter(el).children).forEach(f)
}

class ECElement extends Element {
    getInfo() {
        const box = getElementRectInPoints(this.$el)
        const name = this.name
        const numChildren = this.$el.children.length
        return {
            name, 
            ...box,
        }
    }
    hasChildren() {
        return !!this.$el.children.length
    }
    getNames() {
        const store = []
        const runner = (child) => {
            store.push(child.name)
        }
        this.iterate(runner)
        return store
    }
    constructor(el, parent) {
        const element = elementGetter(el)
        super(element, parent)
        this.elementStyle = new ElementStyle(element)
    }

    get name() {
        return this.$el.className
    }

    propagate() {
        const json = this.elementStyle.toJSON()
        const elements = querySelectorAll(this.name)
        elements.forEach((element) => {
            if (element == this.$el) {
                return
            }
            assignStyle(element, json)
        })
    }
}

function elementGetter(el) {
    if (!el) {
        return
    }
    if (isVNode(el)) {
        return el.$el
    }

    if (isElement(el)) {
        return el
    }

    if (isString(el)) {
        if (el.includes("#")) {
            return document.getElementById(el.slice(1))
        }
        return document.querySelector(fixSelector(el))
    }
}

function isVNode(x) {
    return x.hasOwnProperty("$el")
}

function isElement(x) {
    return /^(?:HTML|SVG)/.test(x.constructor.name)
}

function isString(s) {
    return typeof s === "string"
}

function fixSelector(s) {
    if (/^\W/.test(s)) {
        return s
    }
    if (HTML_CLOSING_TAGS.includes(getFirstWord(s))) {
        return s
    }
    return "." + s
}

function getFirstWord(x) {
    return search(/[a-zA-Z]\w*/, x)
}

function search(regex, s, flags = "") {
    if (isString(regex)) regex = RegExp(regex, flags)
    const match = s.match(regex)
    return matchGetter(match, "search")
}

function matchGetter(match, mode) {
    if (mode == "rep") {
        switch (match.length) {
            case 3:
                return match[0]
            case 4:
                return match[1]
            default:
                return match.slice(1, -2)
        }
    }
    if (mode == "mget") {
        return match.length == 1
            ? match[0]
            : match.length == 0
            ? ""
            : match
    }

    if (mode == "searchArray") {
        return !match
            ? null
            : match.length == 1
            ? [match[0]]
            : match.length == 2
            ? [match[1] || match[0]]
            : match.slice(1).filter(exists)
    }

    if (mode == "search") {
        return !match
            ? null
            : match.length == 1
            ? match[0]
            : match.length == 2
            ? match[1] || match[0]
            : match.slice(1).filter(exists)
    }

    if (mode == "findall") {
        //console.log(match)
        return match.length == 1
            ? match[0]
            : smallify(match.slice(1).filter(isDefined))
    }
}

function exists(input) {
    if (input == null) return false
    if (isString(input)) return input.trim().length > 0
    if (isArray(input))
        return input.filter(exists).length > 0
    if (isObject(input))
        return Object.keys(input).length > 0
    return true
}

function isArray(a) {
    return Array.isArray(a)
}

function isObject(x) {
    return type(x) == "Object"
}

function type(x) {
    let s = Object.prototype.toString.call(x)
    return s.slice(8, -1)
}

function smallify(a) {
    if (a.length == 1) {
        return a[0]
    }
    return a
}

function isDefined(x) {
    return x != null
}

class ElementStyle {
    repeat() {}
    use(key) {}
    constructor(element) {
        this
        this.$el = element
        this.reset()
    }

    reset() {
        this.stack = new UndoRedo()
    }

    update(data) {
        if (!data) {
            return
        }
        const style = data.reduce((acc, [a, b]) => {
            acc[a] = b
            return acc
        }, {})

        assignStyle(this.$el, style)
    }

    add(style) {
        /* style is an AA */
        this.update(this.stack.add(style))
    }
    undo() {
        /* kind of inefficient tbh */
        this.update(this.stack.undo())
    }
    redo() {
        this.update(this.stack.redo())
    }
    toJSON() {
        return dict(this.stack.added)
    }
    toString() {
        return cssString(this.$el.className, this.toJSON())
    }
}
class UndoRedo {
    constructor() {
        this.added = []
        this.popped = []
        this.temp
    }
    redo() {
        if (!this.popped.length) {
            return
        }
        this.temp = this.popped.pop()
        this.added.push(this.temp)
        return this.added
    }
    undo() {
        if (!this.added.length) {
            return
        }
        this.temp = this.added.pop()
        this.popped.push(this.temp)
        return this.added
    }
    add(item) {
        this.added.push(item)
        return this.added
    }
}

function assignStyle(el, payload) {
    Object.assign(el.style, payload)
}

function dict(a, fn) {
    if (!exists(a)) {
        return {}
    }

    if (isNestedArray(a)) {
        return a.reduce((acc, [a, b]) => {
            acc[a] = fn ? fn(b) : b
            return acc
        }, {})
    }

    if (fn) {
        if (isObject(fn)) {
            fn = dictf(fn)
        }
        return a.reduce((acc, item, i) => {
            const value = fn(item)
            if (isDefined(value)) {
                acc[item] = value
            }
            return acc
        }, {})
    }
    if (isObject(a)) {
        return a
    }
    return { [a[0]]: a[1] }
}

function isNestedArray(x) {
    return isArray(x) && isArray(x[0])
}

function dictf(dict, returnKey) {
    return function lambda(key) {
        const value = dict[key]
        if (hasValue(value)) return value
        return returnKey ? key : null
    }
}

function hasValue(s) {
    if (s === "") return false
    if (s == null) return false
    return true
}

function querySelectorAll(q) {
    if (!q) return []
    return Array.from(
        document.querySelectorAll(fixSelector(q))
    )
}

function firstElement() {
    return document.body.children[0]
}

function addElementProperties(element, options) {
    const unit = "pt"
    const excludeUnits = ["lineHeight", "zIndex", "text"]

    if (options.x || options.y || options.pos) {
        el.style.position = "absolute"
    }

    for (let [k, v] of Object.entries(options)) {
        if (k == null || v == null) {
            continue
        }
        if (v && isNumber(v) && !excludeUnits.includes(k)) {
            v += unit
        }

        if (k == "id") {
            el.setAttribute("id", v)
        } else if (k == "chiiiiart") {
            el.setAttribute("id", v)
        } else if (k == "board") {
            const board = plainBoard(v)
            return board
        } else if (k == "chart") {
            const context = el.getContext("2d")
            el.chart = new Chart(context, v)
        } else if (k == "graph") {
            el.setAttribute("id", v.id)
            const board = JSXInit(v)
            switch (v.type) {
                case "triangle":
                    jTriangle(board, v)
                    break
            }
        } else if (k == "input") {
            el.addEventListener("input", v)
        } else if (k == "keydown" || k == "keypress") {
            el.addEventListener("keydown", v)
        } else if (k == "keydown" || k == "keypress") {
            el.addEventListener("keydown", v)
        } else if (k == "s") {
            addProps(el, v)
        } else if (k == "container") {
            const container = toSnakeCase(v) + "-container"
            blue(container)
            return
            el.classList.add(container)
        } else if (k == "s") {
            addProps(el, v)
        } else if (k == "bg" || k == "background") {
            el.style.background =
                v === true
                    ? randomColor({ vibrant: true })
                    : v
        } else if (k == "fs") {
            el.style.width = "100%"
            el.style.height = "100%"
        } else if (k == "span") {
            el.style.display = "inline"
        } else if (k == "abs") {
            el.style.position = "abs"
        } else if (k == "rel") {
            el.style.position = "rel"
        } else if (k == "italic") {
            el.style.fontStyle = "italic"
        } else if (k == "bold") {
            el.style.fontWeight = "600"
        } else if (k == "size") {
            el.style.fontSize = v
        } else if (k == "font") {
            el.style.fontFamily = v
        } else if (k == "circle") {
            el.style.borderRadius = "50%"
        } else if (k == "radius") {
            el.style.width = v
            el.style.height = v
            el.style.borderRadius = "50%"
        } else if (k == "left" || k == "x") {
            el.style.left = v
        } else if (k == "y" || k == "top") {
            el.style.top = v
        } else if (k == "pos") {
            const [x, y] = v
            el.style.left = x + "px"
            el.style.top = y + "px"
        } else if (k == "text" && v) {
            el.innerText = v.toString()
        } else if (k == "html" || k == "innerHTML") {
            if (v) el.innerHTML = v.toString()
        } else if (
            k == "class" ||
            k == "name" ||
            k == "className"
        ) {
            if (k == "name") {
                el.dataset.name = v
            } else {
                el.classList.add(v)
            }
        } else if (k == "data") {
            Object.assign(el.dataset, v)
        } else if (k == "w" || k == "width") {
            el.style.width = v
        } else if (k == "h" || k == "height") {
            el.style.height = v
        } else if (k == "getPointHeight") {
            el.textContent = getPointHeight(el)
        }
    }
    return options
}

function isNumber(s) {
    return (
        typeof s == "number" || /^-?\d+(?:\.\d+)?$/.test(s)
    )
}

function getPointHeight(el) {
    return el.getBoundingClientRect().height * 0.75
}

function runDom() {
    setTimeout(() => {
        const dom = new DomTree()
        return 
        console.log(dom, 'dom')
        dom.forEach()
        return 
        dom.forEach(
            (el) => {
                console.log(el.getInfo())
                if (!el.hasChildren()) {
                    el.edit({
                        getPointHeight: true,
                    })
                }
            },
            { depthes: [0, 1] }
        )
    }, 50)
}

function sleep(delay = 3000) {
    return new Promise((resolve) =>
        setTimeout(resolve, delay)
    )
}

function getElementRectInPoints(el, round = true) {
  let { height, width, top, left } = el.getBoundingClientRect();
  height = height * 0.75;
  width = width * 0.75;
  top = top * 0.75;
  left = left * 0.75;
  if (round) {
    height = Math.round(height);
    width = Math.round(width);
    top = Math.round(top);
    left = Math.round(left);
  }
  return { width, height, top, left };
}

