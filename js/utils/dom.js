/**
 * Selects a single element from the DOM.
 * @param {string} selector
 * @param {Element|Document} parent
 * @returns {Element|null}
 */
export const $ = (selector, parent = document) => parent.querySelector(selector);

/**
 * Selects all matching elements from the DOM.
 * @param {string} selector
 * @param {Element|Document} parent
 * @returns {NodeList}
 */
export const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

/**
 * Selects an element by ID.
 * @param {string} id
 * @returns {Element|null}
 */
export const byId = (id) => document.getElementById(id);

/**
 * Toggles a class or adds/removes based on condition.
 * @param {Element} element
 * @param {string} className
 * @param {boolean} [condition] - Optional condition. If provided, true adds, false removes.
 */
export const toggle = (element, className, condition) => {
    if (!element) return;
    if (condition === undefined) {
        element.classList.toggle(className);
    } else if (condition) {
        element.classList.add(className);
    } else {
        element.classList.remove(className);
    }
};

/**
 * Creates a DOM element with attributes and children.
 * @param {string} tag - The HTML tag name.
 * @param {Object} [attributes] - Attributes map (className, dataset, style, events).
 * @param {(string|Element)[]} [children] - Array of children.
 * @returns {Element}
 */
export const create = (tag, attributes = {}, children = []) => {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className' || key === 'class') {
            element.className = value;
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.assign(element.dataset, value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else if (key === 'innerHTML') {
            element.innerHTML = value; // Use with caution
        } else if (key === 'textContent') {
            element.textContent = value;
        } else {
            element.setAttribute(key, value);
        }
    });

    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });

    return element;
};
