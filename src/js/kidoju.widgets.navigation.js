/**
 * Copyright (c) 2013-2015 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint browser: true, jquery: true */
/* globals define: false */

(function (f, define) {
    'use strict';
    define(['./vendor/kendo/kendo.binder', './kidoju.data', './kidoju.tools'], f);
})(function () {

    'use strict';

    (function ($, undefined) {

        var kendo = window.kendo,
            data = kendo.data,
            ObservableArray = data.ObservableArray,
            Widget = kendo.ui.Widget,
            kidoju = window.kidoju,
            Page = kidoju.data.Page,
            PageCollectionDataSource = kidoju.data.PageCollectionDataSource,

        // Types
            NULL = null,
            NUMBER = 'number',
            STRING = 'string',

        // Events
            CHANGE = 'change',
            CLICK = 'click',
            DATABINDING = 'dataBinding',
            DATABOUND = 'dataBound',
            MOUSEENTER = 'mouseenter',
            MOUSELEAVE = 'mouseleave',
            FOCUS = 'focus',
            BLUR = 'blur',
            SELECT = 'select',
            NS = '.kendoNavigation',

        // Widget
            WIDGET_CLASS = 'k-widget k-group kj-navigation',
            HOVER_CLASS = 'k-state-hover',
            FOCUSED_CLASS = 'k-state-focused',
            SELECTED_CLASS = 'k-state-selected',
            HINT_CLASS = 'kj-hint',
            DATA_UID = kendo.attr('uid'),
            ALL_ITEMS_SELECTOR = 'div.kj-item[' + DATA_UID + ']',
            ITEM_BYUID_SELECTOR = 'div.kj-item[' + DATA_UID + '="{0}"]',
            ARIA_SELECTED = 'aria-selected';

        /*********************************************************************************
         * Helpers
         *********************************************************************************/

        function log(message) {
            if (window.app && window.app.DEBUG && window.console && $.isFunction(window.console.log)) {
                window.console.log('kidoju.widgets.navigation: ' + message);
            }
        }

        /**
         * Asserts
         * Note: Use asserts where unmet conditions are independent from user entries, and
         * developers should be warned that there is probably something unexpected in their code
         */
        var assert = $.extend(
            // By extending assert, we ensure we can call both assert() and assert.ok() for the same result (like in nodeJS)
            function(test, message) {
                if (!test) { throw new Error(message); }
            },
            {
                enum: function(array, value, message) { if (array.indexOf(value) === -1) { throw new Error(message); } },
                equal: function(expected, actual, message) { if (expected !== actual) { throw new Error(message); } },
                instanceof: function(Class, value, message) { if (!(value instanceof Class)) { throw new Error(message); } },
                isOptionalObject: function(value, message) { if ($.type(value) !== 'undefined' && (!$.isPlainObject(value) || $.isEmptyObject(value))) { throw new Error(message); } },
                isPlainObject: function(value, message) { if (!$.isPlainObject(value) || $.isEmptyObject(value)) { throw new Error(message); } },
                isUndefined: function(value, message) { if ($.type(value) !== 'undefined') { throw new Error(message); } },
                match: function(rx, value, message) { if ($.type(value) !== STRING || !rx.test(value)) { throw new Error(message); } },
                ok: function(test, message) { return assert(test, message); },
                type: function(type, value, message) { if ($.type(value) !== type) { throw new TypeError(message); } }
            },
            {
                messages: {
                    isPlainObject: {
                    },
                    isUndefined: {
                    },
                    match: {
                    }
                }
            }
        );

        function isGuid(value) {
            // See http://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
            return ($.type(value) === STRING) && (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value));
        }

        /*********************************************************************************
         * Widget
         *********************************************************************************/

        /**
         * Navigation widget
         * *class
         * @type {*}
         */
        var Navigation = Widget.extend({

            /**
             * Widget constructor
             * @param element
             * @param options
             */
            init: function (element, options) {
                var that = this;
                // base call to widget initialization
                Widget.fn.init.call(this, element, options);
                that._templates();
                that._layout();
                that._addSorting();
                that._dataSource();
                // that.refresh();
                log('widget initialized');
            },

            /**
             * Wdiget options
             */
            options: {
                name: 'Navigation',
                autoBind: true,
                itemTemplate: '<div data-#: ns #uid="#: uid #" class="kj-item" role="option" aria-selected="false"><div data-#: ns #role="stage"></div></div>',
                pageWidth: 1024, // TODO: assuming page size here: where do we read it from?
                pageHeight: 768,
                selectionBorder: 10, // this is the padding of the page wrapper, which draws a border around it
                pageSpacing: 20, // pageSpacing - selectionBorder determines the margin
                menuIcon: 'calibration_mark.svg'
            },

            /**
             * Widget events
             */
            events: [
                CHANGE,
                DATABINDING,
                DATABOUND,
                SELECT
            ],

            /**
             * @method setOptions
             * @param options
             */
            // setOptions: function (options) {
            //    Widget.fn.setOptions.call(this, options);
            //    TODO: we need to read height and width both from styles and options and decide which wins
            // },

            /**
             * Gets/Sets the index of the selected page in the navigation
             * Note: index is 0 based, whereas playbar page numbers are 1 based
             * @method index
             * @param index
             * @returns {*}
             */
            index: function (index) {
                var that = this, page;
                if (index !== undefined) {
                    if ($.type(index) !== NUMBER || index % 1 !== 0) {
                        throw new TypeError();
                    } else if (index < 0 || (index > 0 && index >= that.length())) {
                        throw new RangeError();
                    } else {
                        page = that.dataSource.at(index);
                        that.value(page);
                    }
                } else {
                    page = that.dataSource.getByUid(that._selectedUid);
                    if (page instanceof Page) {
                        return that.dataSource.indexOf(page);
                    } else {
                        return -1;
                    }
                }
            },

            /**
             * Gets/Sets the id of the selected page in the navigation
             * @method id
             * @param id
             * @returns {*}
             */
            id: function (id) {
                var that = this, page;
                if (id !== undefined) {
                    if ($.type(id) !== STRING && $.type(id) !== NUMBER) {
                        throw new TypeError();
                    }
                    page = that.dataSource.get(id);
                    that.value(page);
                } else {
                    page = that.dataSource.getByUid(that._selectedUid);
                    if (page instanceof Page) {
                        return page[page.idField];
                    }
                }
            },

            /**
             * Gets/Sets the value of the selected page in the navigation
             * @method value
             * @param page
             * @returns {*}
             */
            value: function (page) {
                var that = this;
                if (page === NULL) {
                    if (that._selectedUid !== NULL) {
                        that._selectedUid = NULL;
                        log('selected page uid set to null');
                        that._toggleSelection();
                        that.trigger(CHANGE, {
                            index: undefined,
                            value: page
                        });
                    }
                } else if (page !== undefined) {
                    if (!(page instanceof Page)) {
                        throw new TypeError();
                    }
                    // Note: when that.value() was previously named that.selection() with a custom binding
                    // the selection binding was executed before the source binding so we had to record the selected page
                    // in a temp variable (that._tmp) and assign it to the _selectedUid in the refresh method,
                    // that is after the source was bound.
                    // The corresponding code has now been removed after renaming that.selection() into that.value()
                    // because the value binding is executed after the source binding.
                    if (page.uid !== that._selectedUid && isGuid(page.uid)) {
                        var index = that.dataSource.indexOf(page);
                        if (index > -1) {
                            that._selectedUid = page.uid;
                            log('selected page uid set to ' + page.uid);
                            that._toggleSelection();
                            that.trigger(CHANGE, {
                                index: index,
                                value: page
                            });
                        }
                    }
                } else {
                    if (that._selectedUid === NULL) {
                        return NULL;
                    } else {
                        return that.dataSource.getByUid(that._selectedUid); // This returns undefined if not found
                    }
                }
            },

            /**
             * @method total()
             * @returns {*}
             */
            length: function () {
                return (this.dataSource instanceof PageCollectionDataSource) ? this.dataSource.total() : -1;
            },

            /**
             * Returns all children of the ul list
             * This method is required for triggering the dataBinding event
             * @method items
             * @returns {Function|children|t.children|HTMLElement[]|ct.children|node.children|*}
             */
            items: function () {
                return this.element[0].children;
            },

            /**
             * Height of navigation
             * @param value
             * @returns {string}
             */
            height: function (value) {
                var that = this;
                if (value) {
                    if ($.type(value) !== NUMBER) {
                        throw new TypeError();
                    }
                    if (value < 0) {
                        throw new RangeError();
                    }
                    if (value !== that.options.height) {
                        that.options.height = value;
                    }
                }
                else {
                    return that.options.height;
                }
            },

            /**
             * Width of navigation
             * @param value
             * @returns {string}
             */
            width: function (value) {
                var that = this;
                if (value) {
                    if ($.type(value) !== NUMBER) {
                        throw new TypeError();
                    }
                    if (value < 0) {
                        throw new RangeError();
                    }
                    if (value !== that.options.width) {
                        that.options.width = value;
                    }
                }
                else {
                    return that.options.width;
                }
            },

            /**
             * Templates
             * @private
             */
            _templates: function () {
                this._itemTemplate = kendo.template(this.options.itemTemplate);
            },

            /**
             * Changes the dataSource
             * @method setDataSource
             * @param dataSource
             */
            setDataSource: function (dataSource) {
                // set the internal datasource equal to the one passed in by MVVM
                this.options.dataSource = dataSource;
                // rebuild the datasource if necessary, or just reassign
                this._dataSource();
            },

            /**
             * Binds the widget to the change event of the dataSource
             * See http://docs.telerik.com/kendo-ui/howto/create-custom-kendo-widget
             * @method _dataSource
             * @private
             */
            _dataSource: function () {
                var that = this;
                // if the DataSource is defined and the _refreshHandler is wired up, unbind because
                // we need to rebuild the DataSource

                // There is no reason why, in its current state, it would not work with any dataSource
                // if ( that.dataSource instanceof DataSource && that._refreshHandler ) {
                if (that.dataSource instanceof PageCollectionDataSource && that._refreshHandler) {
                    that.dataSource.unbind(CHANGE, that._refreshHandler);
                }

                if (that.options.dataSource !== NULL) {  // use null to explicitely destroy the dataSource bindings
                    // returns the datasource OR creates one if using array or configuration object
                    that.dataSource = PageCollectionDataSource.create(that.options.dataSource);

                    that._refreshHandler = $.proxy(that.refresh, that);

                    // bind to the change event to refresh the widget
                    that.dataSource.bind(CHANGE, that._refreshHandler);

                    if (that.options.autoBind) {
                        that.dataSource.fetch();
                    }
                }
            },

            /**
             * Builds the widget layout
             * @private
             */
            _layout: function () {
                var that = this;
                // Define wrapper for visible bindings
                that.wrapper = that.element;
                // Define element
                that.element
                    .addClass(WIDGET_CLASS)
                    .attr('role', 'listbox')
                    .on(MOUSEENTER + NS + ' ' + MOUSELEAVE + NS, ALL_ITEMS_SELECTOR, that._toggleHover)
                    .on(FOCUS + NS + ' ' + BLUR + NS, ALL_ITEMS_SELECTOR, that._toggleFocus)
                    .on(CLICK + NS, ALL_ITEMS_SELECTOR, $.proxy(that._click, that));
                kendo.notify(that);
            },

            /**
             * Add sorting
             * @private
             */
            _addSorting: function () {
                var that = this;
                that.element.kendoSortable({
                    hint: function (element) {
                        return element.clone().addClass(HINT_CLASS);
                    },
                    change: function (e) {
                        if (e.action === 'sort' && e.item instanceof $ && $.type(e.oldIndex) === NUMBER && $.type(e.newIndex) === NUMBER) {
                            $.noop(); // TODO VERY VERY IMPORTANT reorder dataSOurce ................................................................................................
                        }
                    }
                });
            },

            /**
             * Add a navigation item containing a stage(page) wrapped in a div
             * @param page
             * @param index
             * @private
             */
            _addItem: function (page, index) {
                var that = this,
                    navigation = that.element;

                // Check that we get a page that is not already in navigation
                if (page instanceof Page && navigation.find(kendo.format(ITEM_BYUID_SELECTOR, page.uid)).length === 0) {

                    // Create navigation item (actually a selection frame around the thumbnail stage)
                    var navigationItem = $(that._itemTemplate({uid: page.uid, ns: kendo.ns}))
                        .css({
                            boxSizing: 'border-box',
                            position: 'relative',
                            padding: parseInt(that.options.selectionBorder, 10),
                            margin: parseInt(that.options.pageSpacing, 10) - parseInt(that.options.selectionBorder, 10)
                        });

                    // Add to navigation
                    navigation.append(navigationItem);

                    // Make the stage and bind to components
                    navigationItem.find(kendo.roleSelector('stage')).kendoStage({
                        mode: kendo.ui.Stage.fn.modes.thumbnail,
                        dataSource: page.components,
                        scale: that._getStageScale()
                    });

                }
            },

            /**
             * Remove a navigation item (and its embedded stage)
             * @param uid
             * @private
             */
            _removeItemByUid: function (uid) {
                // Find and remove navigation item containing stage
                var item = this.element.find(kendo.format(ITEM_BYUID_SELECTOR, uid));
                // kendo.unbind(item);
                kendo.destroy(item);
                item.off().remove();
            },

            /**
             * Refreshes the widget when dataSource changes
             * @param e
             */
            refresh: function (e) {
                var that = this,
                    selectedIndex = that.index();
                if (e && e.action === undefined) {
                    that.trigger(DATABINDING);
                }
                if (e === undefined || e.action === undefined) {
                    var pages = [];
                    if (e === undefined && that.dataSource instanceof PageCollectionDataSource) {
                        pages = that.dataSource.data();
                    } else if (e && e.items instanceof ObservableArray) {
                        pages = e.items;
                    }
                    $.each(that.element.find(ALL_ITEMS_SELECTOR), function (index, item) {
                        that._removeItemByUid($(item).attr(DATA_UID));
                    });
                    $.each(pages, function (index, page) {
                        that._addItem(page);
                    });
                } else if (e.action === 'add' && $.isArray(e.items) && e.items.length) {
                    $.each(e.items, function (index, page) {
                        // TODO: Consider inserting the page at index + 1
                        that._addItem(page);
                    });
                    selectedIndex = that.dataSource.indexOf(e.items[e.items.length - 1]);
                } else if (e.action === 'remove' && $.isArray(e.items) && e.items.length) {
                    $.each(e.items, function (index, page) {
                        that._removeItemByUid(page.uid);
                    });
                    selectedIndex = e.index || -1;
                } else if (e.action === 'itemchange') {
                    return;
                }
                var total = that.dataSource.total();
                if (total > 0 && selectedIndex > -1 && selectedIndex < total ) {
                    that.index(selectedIndex);
                } else if (total > 0 && selectedIndex <= -1) {
                    that.index(0);
                } else if (total > 0 && selectedIndex >= total) {
                    that.index(total - 1);
                } else {
                    that.value(null);
                }
                //that._toggleSelection();
                that.resize();
                if (e && e.action === undefined) {
                    that.trigger(DATABOUND);
                }
            },

            /**
             * Adds the k-state-selected class to the selected page determined by that._selectedUid
             * This actually adds a coloured border
             * @method displaySelection
             */
            _toggleSelection: function () {
                this.element.find(ALL_ITEMS_SELECTOR)
                    .removeClass(SELECTED_CLASS)
                    .removeProp(ARIA_SELECTED);

                this.element.find(kendo.format(ITEM_BYUID_SELECTOR, this._selectedUid))
                    .addClass(SELECTED_CLASS)
                    .prop(ARIA_SELECTED, true);
            },

            /**
             * Get stage scale
             * @returns {number}
             * @private
             */
            _getStageScale: function () {
                var scale = (this.element.innerWidth() - 2 * parseInt(this.options.pageSpacing, 10) - 2 * parseInt(this.options.selectionBorder, 10)) / parseInt(this.options.pageWidth, 10);
                if (scale < 0) {
                    scale = 0;
                }
                return scale;
            },

            /**
             * Resizes pages according to widget size
             * @method resize
             */
            resize: function () {
                var that = this,
                    navigation = that.element,
                    scale = that._getStageScale();

                // TODO: we are not clear with borders here
                // we actually need the widget's outerWidth and outerHeight
                // becaus a border might be added to pageWidth and pageHeight
                navigation.find(ALL_ITEMS_SELECTOR)
                    .width(scale * parseInt(that.options.pageWidth, 10))
                    .height(scale * parseInt(that.options.pageHeight, 10));

                var stages = navigation.find(kendo.roleSelector('stage'));
                for (var i = 0; i < stages.length; i++) {
                    $(stages[i]).data('kendoStage').scale(scale);
                }
            },

            /**
             * Toggles the hover style when mousing over mavigation items (a stage with ou outer div that acts as a frame)
             * @method _toggleHover
             * @param e
             * @private
             */
            _toggleHover: function (e) {
                if (e instanceof $.Event) {
                    $(e.currentTarget).toggleClass(HOVER_CLASS, e.type === MOUSEENTER);
                }
            },

            /**
             * Toggles the focus style when an explorer item has focus
             * @method _toggleFocus
             * @param e
             * @private
             */
            _toggleFocus: function (e) {
                if (e instanceof $.Event) {
                    $(e.currentTarget).toggleClass(FOCUSED_CLASS, e.type === FOCUS);
                }
            },

            /**
             * Click event handler bond to page wrappers to select a page
             * @method _click
             * @param e
             * @private
             */
            _click: function (e) {
                if (e instanceof $.Event) {
                    e.preventDefault();
                    var target = $(e.currentTarget),
                        navigation = target.closest(kendo.roleSelector('navigation'));
                    if (!target.is('.' + SELECTED_CLASS)) {
                        var page = this.dataSource.getByUid(target.attr(kendo.attr('uid')));
                        this.value(page);
                    }
                }
            },

            /**
             * @method _clear
             * @private
             */
            _clear: function () {
                var that = this;
                // unbind kendo
                kendo.unbind(that.element);
                // unbind all other events
                that.element.find('*').off();
                that.element
                    .off()
                    .empty()
                    .removeClass(WIDGET_CLASS);
            },

            /**
             * Destroys the widget including all DOM modifications
             */
            destroy: function () {
                var that = this;
                Widget.fn.destroy.call(that);
                that._clear();
                that.setDataSource(NULL);
                kendo.destroy(that.element);
            }

        });

        kendo.ui.plugin(Navigation);

    }(window.jQuery));

    return window.kendo;

}, typeof define === 'function' && define.amd ? define : function (_, f) { 'use strict'; f(); });
