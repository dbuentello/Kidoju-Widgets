/**
 * Copyright (c) 2013-2016 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint browser: true, jquery: true */
/* globals define: false */

(function (f, define) {
    'use strict';
    define([
        './window.assert',
        './window.logger',
        './vendor/kendo/kendo.binder'
    ], f);
})(function () {

    'use strict';

    (function ($, undefined) {

        var kendo = window.kendo;
        var ui = kendo.ui;
        var Widget = ui.Widget;
        var assert = window.assert;
        var logger = new window.Logger('kidoju.widgets.multicheckbox');
        var NS = '.kendoQuiz';
        var STRING = 'string';
        var UNDEFINED = 'undefined';
        var CHANGE = 'change';
        var CLICK = 'click';
        var ACTIVE = 'k-state-active';
        var DISABLE = 'k-state-disabled';
        var WIDGET_CLASS = 'kj-multicheckbox'; // 'k-widget kj-multicheckbox',
        var RADIO = '<div class="kj-multicheckbox-item"><input id="{1}_{2}" name="{1}" type="radio" class="k-radio" value="{0}"><label class="k-radio-label" for="{1}_{2}">{0}</label></div>';
        var MARGIN = '0.2em';
        var MODES = {
                BUTTON: 'button',
                DROPDOWN: 'dropdown',
                RADIO: 'radio'
            };

        /*********************************************************************************
         * Helpers
         *********************************************************************************/

        /**
         * Build a random hex string of length characters
         * @param length
         * @returns {string}
         */
        function randomString(length) {
            var s = new Array(length + 1).join('x');
            return s.replace(/x/g, function (c) {
                /* jshint -W016 */
                return (Math.random() * 16|0).toString(16);
                /* jshint +W016 */
            });
        }

        function randomId() {
            return 'id_' + randomString(6);
        }

        function formatStyle(style) {
            if ($.isPlainObject(style)) {
                return style;
            } else if ($.type(style) === STRING) {
                var ret = {};
                var styleArray = style.split(';');
                for (var i = 0; i < styleArray.length; i++) {
                    var styleKeyValue = styleArray[i].split(':');
                    if ($.isArray(styleKeyValue) && styleKeyValue.length === 2) {
                        var key = styleKeyValue[0].trim();
                        var value = styleKeyValue[1].trim();
                        if (key.length && value.length) {
                            ret[key] = value;
                        }
                    }
                }
                return ret;
            } else {
                return {};
            }
        }

        /*********************************************************************************
         * Widget
         *********************************************************************************/

        /**
         * MultiCheckBox widget
         */
        var MultiCheckBox = Widget.extend({

            /**
             * Constructor
             * @param element
             * @param options
             */
            init: function (element, options) {
                var that = this;
                Widget.fn.init.call(that, element, options);
                logger.debug('widget initialized');
                that._value = that.options.value;
                that._randomId = randomId();
                that.setOptions(that.options);
                that._layout();
                that._dataSource();
                that.enable(that.options.enable);
            },

            /**
             * Widget options
             */
            options: {
                name: 'MultiCheckBox',
                autoBind: true,
                dataSource: [],
                itemStyle: {},
                activeStyle: {},
                value: null,
                enable: true
            },

            /**
             *
             * @param options
             */
            setOptions: function (options) {
                var that = this;
                Widget.fn.setOptions.call(that, options);
                options = that.options;
                options.groupStyle = formatStyle(options.groupStyle);
                options.itemStyle = formatStyle(options.itemStyle);
                options.activeStyle = formatStyle(options.activeStyle);
            },

            /**
             * Widget events
             */
            events: [
                CHANGE
            ],

            /**
             * Gets/sets the value
             * @param value
             */
            value: function (value) {
                var that = this;
                if ($.type(value) === STRING) {
                    // Note: Giving a value to the dropDownList that does not exist in dataSource is discarded without raising an error
                    if (that._value !== value && that.dataSource instanceof kendo.data.DataSource && that.dataSource.data().indexOf(value) > -1) {
                        that._value = value;
                        that._toggleUI();
                        that.trigger(CHANGE);
                    }
                } else if (value === null) {
                    if (that._value !== value) {
                        that._value = null;
                        that._toggleUI();
                        that.trigger(CHANGE);
                    }
                } else if ($.type(value) === 'undefined') {
                    return that._value;
                } else {
                    throw new TypeError('`value` is expected to be a string if not undefined');
                }
            },

            /**
             * Widget layout
             * @private
             */
            _layout: function () {
                var that = this;
                that.wrapper = that.element;
                that.element
                    .addClass(WIDGET_CLASS);
                // refresh updates checkboxes
            },


            /**
             * Event handler for click event and radios and buttons
             * Handles
             * @param e
             * @private
             */
            _onClick: function (e) {
                assert.instanceof($.Event, e, kendo.format(assert.messages.instanceof.default, 'e', 'jQuery.Event'));
                var that = this;
                var target = $(e.target);
                var value = target.val();
                if (value !== that._value) {
                    that._value = value;
                } else { // clicking the same value resets the button (and value)
                    that._value = null;
                }
                that._toggleUI();
                that.trigger(CHANGE, { value: that._value });
            },

            /**
             * Update UI when value is changed
             * @private
             */
            _toggleUI: function () {
                var that = this;
                var element = this.element;
                assert.instanceof($, element, kendo.format(assert.messages.instanceof.default, 'this.element', 'jQuery'));
                element.children('div')
                    .attr('style', '')
                    .css(that.options.itemStyle);
                if (that._value) {
                    element.find('input[type=checkbox][value="' + that._value + '"]')
                        .prop('checked', true)
                        .parent()
                            .attr('style', '')
                            .css($.extend({}, that.options.itemStyle, that.options.activeStyle));
                } else {
                    element.find('input[type=radio]:checked')
                        .prop('checked', false);
                }
            },

            /**
             * _dataSource function to bind refresh to the change event
             * @private
             */
            _dataSource: function () {
                var that = this;

                // returns the datasource OR creates one if using array or configuration
                that.dataSource = kendo.data.DataSource.create(that.options.dataSource);

                // bind to the change event to refresh the widget
                if (that._refreshHandler) {
                    that.dataSource.unbind(CHANGE, that._refreshHandler);
                }
                that._refreshHandler = $.proxy(that.refresh, that);
                that.dataSource.bind(CHANGE, that._refreshHandler);

                // Assign dataSource to dropDownList
                var dropDownList = that.dropDownList;
                if (dropDownList instanceof kendo.ui.DropDownList && dropDownList.dataSource !== that.dataSource) {
                    dropDownList.setDataSource(that.dataSource);
                }

                // trigger a read on the dataSource if one hasn't happened yet
                if (that.options.autoBind) {
                    that.dataSource.fetch();
                }
            },

            /**
             * sets the dataSource for source binding
             * @param dataSource
             */
            setDataSource: function (dataSource) {
                var that = this;
                // set the internal datasource equal to the one passed in by MVVM
                that.options.dataSource = dataSource;
                // rebuild the datasource if necessary, or just reassign
                that._dataSource();
            },

            /**
             * Refresh method (called when dataSource is updated)
             * for example to add buttons or options
             * @param e
             */
            refresh: function (e) {
                var that = this;
                var element = this.element;
                assert.instanceof($, element, kendo.format(assert.messages.instanceof.default, 'this.element', 'jQuery'));
                if (that.options.mode === MODES.DROPDOWN) {
                    assert.instanceof(kendo.ui.DropDownList, that.dropDownList, kendo.format(assert.messages.instanceof.default, 'that.dropDownList', 'kendo.ui.DropDownList'));
                    that.dropDownList.refresh(e);
                } else {
                    var items = that.dataSource.data();
                    if (e && e.items instanceof kendo.data.ObservableArray) {
                        items = e.items;
                    }
                    that.element.empty();
                    $(e.items).each(function (index, value) {
                        if (that.options.mode === MODES.BUTTON) {
                            $(kendo.format(BUTTON, kendo.htmlEncode(value)))
                                .css(that.options.itemStyle)
                                .appendTo(that.element);
                        } else if (that.options.mode === MODES.RADIO) {
                            var radio = $(kendo.format(RADIO, kendo.htmlEncode(value), that._randomId, index))
                                .css(that.options.itemStyle)
                                .appendTo(that.element);
                            /*
                            var size = parseInt(radio.css('fontSize'), 10) || parseInt(radio.parent().css('fontSize'), 10) || parseInt(radio.parent().parent().css('fontSize'), 10);
                            if (!isNaN(size)) {
                                // TODO See http://www.telerik.com/forums/font-size-of-styled-radio-buttons-and-checkboxes
                                // TODO consider as part of resize event handler
                                radio.find('input[type=radio]')
                                    .height(0.6 * size)
                                    .width(0.6 * size);
                            }
                            */
                        }
                    });
                }
            },

            /**
             * Enable/disable the widget
             * @param enable
             */
            enable: function (enable) {
                var that = this;
                var element = this.element;
                assert.instanceof($, element, kendo.format(assert.messages.instanceof.default, 'this.element', 'jQuery'));
                if ($.type(enable) === UNDEFINED) {
                    enable = true;
                }
                if (that.options.mode === MODES.DROPDOWN) {
                    assert.instanceof(kendo.ui.DropDownList, that.dropDownList, kendo.format(assert.messages.instanceof.default, 'that.dropDownList', 'kendo.ui.DropDownList'));
                    that.dropDownList.enable(enable);
                } else {
                    element.off(NS);
                    if (enable) {
                        element.on(CLICK + NS, 'input', $.proxy(that._onClick, that));
                    } else {
                        // Because input are readonly and not disabled, we need to prevent default (checking checkbox) and let it bubble to the stage element to display the handle box
                        element.on(CLICK + NS, 'input', function (e) {
                            e.preventDefault();
                        });
                    }
                    element.find('input')
                        .toggleClass(DISABLE, !enable)
                        // .prop('disabled', !enable) <--- suppresses the click event so elements are no more selectable in design mode
                        .prop('readonly', !enable);
                }
            },

            /**
             * Destroy widget
             */
            destroy: function () {
                var that = this;
                var element = this.element;
                Widget.fn.destroy.call(that);
                // Destroy the drop down list (especially the popup)
                if (that.dropDownList) {
                    that.dropDownList.destroy();
                    that.dropDownList = undefined;
                }
                // unbind and destroy kendo
                kendo.unbind(element);
                kendo.destroy(element);
                // unbind all other events
                that.element.find('*').off();
                that.element.off(NS);
                // remove descendants
                that.element.empty();
                // remove element classes
                that.element.removeClass(WIDGET_CLASS);
            }

        });

        ui.plugin(MultiCheckBox);

    })(window.jQuery);

    return window.kendo;

}, typeof define === 'function' && define.amd ? define : function (_, f) { 'use strict'; f(); });