/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

import CONSTANTS from '../common/window.constants.es6';
import BaseTool from './tools.base.es6';
import tools from './tools.es6';


/**
 * Label
 * @class
 * @type {void|*}
 */
export default class Label extends BaseTool {
    /**
     * Constructor
     * constructor
     */
    constructor() {
        super({
            id: 'label',
            icon: 'font',
            description: i18n.label.description,
            cursor: CONSTANTS.CROSSHAIR_CURSOR,
            templates: {
                default: '<div class="#: class$() #" style="#: attributes.style #" data-#= ns #id="#: id$() #" data-#= ns #behavior="#: properties.behavior #" data-#= ns #constant="#: properties.constant #">#= (kendo.htmlEncode(attributes.text) || "").replace(/\\n/g, "<br/>") #</div>'
            },
            height: 80,
            width: 300,
            attributes: {
                // text: new adapters.StringAdapter({ title: i18n.label.attributes.text.title, defaultValue: i18n.label.attributes.text.defaultValue }),
                text: new adapters.TextAdapter(
                    {title: i18n.label.attributes.text.title, defaultValue: i18n.label.attributes.text.defaultValue},
                    {rows: 2, style: 'resize:vertical; width: 100%;'}
                ),
                style: new adapters.StyleAdapter({title: i18n.label.attributes.style.title, defaultValue: 'font-size:60px;'})
            },
            properties: {
                behavior: new adapters.EnumAdapter(
                    {
                        title: i18n.label.properties.behavior.title,
                        defaultValue: 'none',
                        enum: ['none', 'draggable', 'selectable'] // TODO i18n
                    },
                    {
                        style: 'width: 100%;'
                    }
                ),
                constant: new adapters.StringAdapter({title: i18n.label.properties.constant.title})
            }
        });
    }

    /**
     * Get Html or jQuery content
     * @method getHtmlContent
     * @param component
     * @param mode
     * @returns {*}
     */
    getHtmlContent: function (component, mode) {
        var that = this;
        assert.instanceof(Label, that, assert.format(assert.messages.instanceof.default, 'this', 'Label'));
        assert.instanceof(PageComponent, component, assert.format(assert.messages.instanceof.default, 'component', 'kidoju.data.PageComponent'));
        assert.enum(Object.keys(kendo.ui.Stage.fn.modes), mode, assert.format(assert.messages.enum.default, 'mode', Object.keys(kendo.ui.Stage.fn.modes)));
        var template = kendo.template(that.templates.default);
        // The class$ function adds the kj-interactive class to draggable components
        component.class$ = function () {
            return 'kj-label' + (component.properties.behavior === 'draggable' ? ' ' + INTERACTIVE_CLASS : '');
        };
        // The id$ function returns the component id for components that have a behavior
        component.id$ = function () {
            return (component.properties.behavior !== 'none' && $.type(component.id) === STRING && component.id.length) ? component.id : '';
        };
        return template($.extend(component, { ns: kendo.ns }));
    },

    /**
     * onResize Event Handler
     * @method onResize
     * @param e
     * @param component
     */
    onResize: function (e, component) {
        var stageElement = $(e.currentTarget);
        assert.ok(stageElement.is(ELEMENT_SELECTOR), kendo.format('e.currentTarget is expected to be a stage element'));
        assert.instanceof(PageComponent, component, assert.format(assert.messages.instanceof.default, 'component', 'kidoju.data.PageComponent'));
        var content = stageElement.children('div');
        if ($.type(component.width) === NUMBER) {
            content.outerWidth(component.get('width') - content.outerWidth(true) + content.outerWidth());
        }
        if ($.type(component.height) === NUMBER) {
            content.outerHeight(component.get('height') - content.outerHeight(true) + content.outerHeight());
            // if (component.attributes && !RX_FONT_SIZE.test(component.attributes.style)) {
            /*
             * We make a best guess for the number of lines as follows
             * Let's suppose the height (line-height, not font-size) and width of a character are respectively y and x
             * We have y = x * sizeRatio
             * How many of these character rectangles (x, y) can we fit in the content div (width, height)?
             *
             * the label only takes 1 line, if we have:
             * y = height and length <= width/x, that is length <= width*sizeRatio/y or y = height <= length*sizeRatio/width, which is length >= width*sizeRatio/height
             *
             * the label takes 2 lines, if we have:
             * y = height/2 and length <= width/x, that is length <= 2*width*sizeRatio/y or y = height/2 <= length*sizeRatio/width, which is length >= 4*width*sizeRatio/height
             *
             * the label takes n lines if we have sqrt((length*height)/sizeRatio*width) <= lines < sqrt(((length + 1)*height)/sizeRatio*width)
             *
             */
            // var length = component.attributes.text.length;
            // var sizeRatio = 1.6; // font-size being the height, this is the line-height/char-width ratio
            // var lines = Math.max(1, Math.floor(Math.sqrt((length * component.height) / (width * sizeRatio))));
            // We can now make a best guess for the font size
            // var fontRatio = 1.2; // this is the line-height/font-size ration
            // content.css('font-size', Math.floor(component.height / lines / fontRatio));
            // Note: in previous versions, we have tried to iterate through a hidden clone
            // to find that font size that does not trigger an overflow but it is too slow
            // }
        }
        // prevent any side effect
        e.preventDefault();
        // prevent event to bubble on stage
        e.stopPropagation();
    },

    /**
     * Component validation
     * @param component
     * @param pageIdx
     */
    validate: function (component, pageIdx) {
        var ret = Tool.fn.validate.call(this, component, pageIdx);
        var description = this.description; // tool description
        var messages = this.i18n.messages;
        if (!component.attributes ||
            !component.attributes.text ||
            (component.attributes.text === i18n.label.attributes.text.defaultValue) ||
            !RX_TEXT.test(component.attributes.text)) {
            ret.push({
                type: WARNING,
                index: pageIdx,
                message: kendo.format(messages.invalidText, description, pageIdx + 1)
            });
        }
        if (!component.attributes ||
            // Styles are only checked if there is any (optional)
            (component.attributes.style && !RX_STYLE.test(component.attributes.style))) {
            // TODO: test small font-size incompatible with mobile devices
            ret.push({
                type: ERROR,
                index: pageIdx,
                message: kendo.format(messages.invalidStyle, description, pageIdx + 1)
            });
        }
        // TODO: We should also check that there is a dropZone on the page if draggable
        return ret;
    }

}

/**
 * Register tool
 */
tools.register(Label);
