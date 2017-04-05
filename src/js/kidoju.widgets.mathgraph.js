/**
 * Copyright (c) 2013-2017 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint browser: true, jquery: true */
/* globals define: false */

(function (f, define) {
    'use strict';
    define([
        './vendor/silentmatt/expr-eval',
        // './vendor/mathjs/math',
        './window.assert',
        './window.logger',
        './vendor/kendo/kendo.binder',
        './vendor/kendo/kendo.color',
        './vendor/kendo/kendo.drawing'
        // TODO we also need spreadsheet toolbar for all the tools which have been registered and which we use
    ], f);
})(function (math) {

    'use strict';

    // Eval is evil, besides x ^ 2 is better than Math.pow(x, 2)
    // So we have identified two proper math parsers:
    // https://github.com/silentmatt/expr-eval (small and simple)
    // https://github.com/josdejong/mathjs (big and feature-rich)
    // See also https://github.com/pegjs/pegjs
    math = math || window.exprEval || window.math;

    /* This function has too many statements. */
    /* jshint -W071 */

    (function ($, undefined) {

        var kendo = window.kendo;
        var data = kendo.data;
        var drawing = kendo.drawing;
        var geometry = kendo.geometry;
        var DataSource = data.DataSource;
        var Group = drawing.Group;
        var Path = drawing.Path;
        var Surface = drawing.Surface;
        var Widget = kendo.ui.Widget;
        var ToolBar = kendo.ui.ToolBar;
        var assert = window.assert;
        var logger = new window.Logger('kidoju.widgets.drawing');
        var NUMBER = 'number';
        var OBJECT = 'object';
        var STRING = 'string';
        var NULL = 'null';
        var UNDEFINED = 'undefined';
        var CHANGE = 'change';
        var DOT = '.';
        var WIDGET = 'kendoMathGraph';
        var NS = DOT + WIDGET;
        var MOUSEDOWN = 'mousedown' + NS + ' ' + 'touchstart' + NS;
        var MOUSEMOVE = 'mousemove' + NS + ' ' + 'touchmove' + NS;
        var MOUSEUP = 'mouseup' + NS + ' ' + 'touchend' + NS;
        var WIDGET_CLASS = 'k-widget kj-mathgraph';
        var WIDGET_SELECTOR = DOT + 'kj-mathgraph';
        var DIV = '<div/>';
        var ATTRIBUTE_SELECTOR = '[{0}="{1}"]';
        var RX_COLOR = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
        var RX_DASHTYPE = /^(dash|dashDot|dot|longDash|longDashDot|longDashDotDot)$/; // Note: `solid` is not listed becuase it is the default
        var TOOLS = [
            'select',
            'point',
            'line',
            'circle',
            'function',
            'text'
        ];
        var TOOLBAR = [
            TOOLS,
            [
                'bold',
                'italic'
            ],
            'backgroundColor',
            'textColor',
            'fontSize',
            'fontFamily'
        ];

        /*********************************************************************************
         * Helpers
         *********************************************************************************/

        var util = {

            /**
             * Get the mouse (or touch) position
             * @param e
             * @param stage
             * @returns {{x: *, y: *}}
             */
            getMousePosition: function (e, stage) {
                assert.instanceof($.Event, e, kendo.format(assert.messages.instanceof.default, 'e', 'jQuery.Event'));
                assert.instanceof($, stage, kendo.format(assert.messages.instanceof.default, 'stage', 'jQuery'));
                // See http://www.jacklmoore.com/notes/mouse-position/
                // See http://www.jqwidgets.com/community/topic/dragend-event-properties-clientx-and-clienty-are-undefined-on-ios/
                // See http://www.devinrolsen.com/basic-jquery-touchmove-event-setup/
                // ATTENTION: e.originalEvent.changedTouches instanceof TouchList, not Array
                var originalEvent = e.originalEvent;
                var clientX = originalEvent && originalEvent.changedTouches ? originalEvent.changedTouches[0].clientX : e.clientX;
                var clientY = originalEvent && originalEvent.changedTouches ? originalEvent.changedTouches[0].clientY : e.clientY;
                // IMPORTANT: Position is relative to the stage and e.offsetX / e.offsetY do not work in Firefox
                // var stage = $(e.target).closest('.kj-stage').find(kendo.roleSelector('stage'));
                var ownerDocument = $(stage.get(0).ownerDocument);
                var stageOffset = stage.offset();
                var mouse = {
                    x: clientX - stageOffset.left + ownerDocument.scrollLeft(),
                    y: clientY - stageOffset.top + ownerDocument.scrollTop()
                };
                return mouse;
            },

            /**
             * Get the position of the center of an element
             * @param element
             * @param stage
             * @param scale
             */
            getElementCenter: function (element, stage, scale) {
                assert.instanceof($, element, kendo.format(assert.messages.instanceof.default, 'element', 'jQuery'));
                assert.instanceof($, stage, kendo.format(assert.messages.instanceof.default, 'stage', 'jQuery'));
                assert.type(NUMBER, scale, kendo.format(assert.messages.type.default, 'scale', NUMBER));
                // We need getBoundingClientRect to especially account for rotation
                var rect = element[0].getBoundingClientRect();
                var ownerDocument = $(stage.get(0).ownerDocument);
                var stageOffset = stage.offset();
                return {
                    left: (rect.left - stageOffset.left + rect.width / 2  + ownerDocument.scrollLeft()) / scale,
                    top: (rect.top - stageOffset.top + rect.height / 2 + ownerDocument.scrollTop()) / scale
                };
            },

            /**
             * Get the scale of an element's CSS transformation
             * Note: the same function is used in kidoju.widgets.stage
             * @param element
             * @returns {Number|number}
             */
            getTransformScale: function (element) {
                assert.instanceof($, element, kendo.format(assert.messages.instanceof.default, 'element', 'jQuery'));
                // element.css('transform') returns a matrix, so we have to read the style attribute
                var match = (element.attr('style') || '').match(/scale\([\s]*([0-9\.]+)[\s]*\)/);
                return $.isArray(match) && match.length > 1 ? parseFloat(match[1]) || 1 : 1;
            }

        };

        /**
         * A kendo.drawing configuration class
         * @see http://docs.telerik.com/kendo-ui/api/javascript/drawing/text#configuration
         */
        var Configuration = kendo.Class.extend({
            // clip,
            // cursor
            fill: {
                color: ''
                // opacity: 1
            },
            font: {
                fontFamily: '',
                fontSize: '',
                fontStyle: ''
            },
            opacity: 1,
            stroke: {
                color: '#000',
                dashType: 'solid',
                // lineCap: 'butt',
                // lineJoin: 'miter',
                // opacity: 1,
                width: 1
            },
            // tooltip,
            // tramsform,
            // visible

            /* This function's cyclomatic complexity is too high. */
            /* jshint -W074 */

            toJSON: function (withFont) {
                /* jshint maxcomplexity: 11 */
                var configuration = {};
                // Fill color
                if (RX_COLOR.test(this.fill.color)) {
                    configuration.fill = configuration.fill || {};
                    configuration.fill.color = this.fill.color;
                }
                // Font (only applies to text)
                if (!!withFont) {
                    // TODO Improve after checking default values
                    configuration.font = this.font.fontStyle + ' ' + this.font.fontSize + ' ' + this.font.fontFamily;
                }
                // Opacity
                if ($.type(this.opacity) === NUMBER && this.opacity >= 0 && this.opacity < 1) {
                    configuration.opacity = this.opacity;
                }
                // Stroke color
                if (RX_COLOR.test(this.stroke.color)) {
                    configuration.stroke = configuration.stroke || {};
                    configuration.stroke.color = this.stroke.color;
                }
                // Stroke dashType
                if (RX_DASHTYPE.test(this.stroke.dashType)) {
                    configuration.stroke = configuration.stroke || {};
                    configuration.stroke.dashType = this.stroke.dashType;
                }
                // Stroke width
                if ($.type(this.stroke.width) === NUMBER && this.stroke.width > 0) {
                    configuration.stroke = configuration.stroke || {};
                    configuration.stroke.width = this.stroke.width;
                }
                return configuration;
            }

            /* jshint +W074 */
        });

        /*********************************************************************************
         * MathGraph Widget
         *********************************************************************************/

        var MathGraph = Widget.extend({

            /**
             * Initializes the widget
             * @param element
             * @param options
             */
            init: function (element, options) {
                var that = this;
                options = options || {};
                Widget.fn.init.call(that, element, options);
                logger.debug({ method: 'init', message: 'widget initialized' });
                that._enabled = that.element.prop('disabled') ? false : that.options.enable;
                that._layout();
                that._dataSource();
                that._tool = 'select';
                that._configuration = new Configuration();
                kendo.notify(that);
            },

            /**
             * Widget options
             * @property options
             */
            options: {
                name: 'MathGraph',
                autoBind: true,
                dataSource: [],
                scaler: 'div.kj-stage',
                grid: {
                    size: {
                        x: 50, // Means a value of 1 is represented with 50 pixels on the X axis
                        y: 50  // Means a value of 1 is represented with 50 pixels on the Y axis
                    },
                    path: {
                        opacity: 0.25,
                        stroke: {
                            color: '#808080'
                        }
                    }
                },
                axis: {
                    position: {
                        x: 50, // In percents
                        y: 50
                    },
                    path: {
                        stroke: {
                            color: '#000000'
                        }
                    }
                },
                // TODO: zoom ?
                enable: true,
                toolbar: '#toolbar',
                tools: TOOLBAR,
                messages: {
                    // TODO
                }
            },

            /**
             * Set options
             * @param options
             */
            setOptions: function (options) {
                var that = this;
                // TODO
            },

            /**
             * Widget events
             * @property events
             */
            events: [
                CHANGE
            ],

            /**
             * Value for MVVM binding
             * @param value
             */
            value: function (value) {
                var that = this;
                if ($.type(value) === STRING || $.type(value) === NULL) {
                    that._value = value;
                } else if ($.type(value) === UNDEFINED) {
                    return that._value;
                } else {
                    throw new TypeError('`value` is expected to be a nullable string if not undefined');
                }
            },

            /**
             * Builds the widget layout
             * @private
             */
            _layout: function () {
                var that = this;
                that.wrapper = that.element;
                // touch-action: 'none' is for Internet Explorer - https://github.com/jquery/jquery/issues/2987
                that.element
                    .addClass(WIDGET_CLASS)
                    .css({ touchAction: 'none' });
                that.surface = Surface.create(that.element);
                // that.surface = drawing.Surface.create(that.element, { type: 'canvas' }); // TODO: remove the type, for testing only
                // that.surface = drawing.Surface.create(that.element, { type: 'svg' }); // TODO: remove the type, for testing only
                that._initToolBar();
            },

            /**
             * Initialize toolbar
             * @private
             */
            _initToolBar: function () {
                var that = this;
                var options = that.options;
                that.toolBar = $(DIV)
                    .appendTo(options.toolbar)
                    .kendoMathGraphToolBar({
                        tools: options.tools,
                        action: $.proxy(that._onToolBarAction, that),
                        dialog: $.proxy(that._onToolBarDialog, that)
                    })
                    .data('kendoMathGraphToolBar');
                that._setTool('select');
            },

            /**
             * Set the current tool
             * @private
             */
            _setTool: function (tool) {
                assert.enum(TOOLS, tool, kendo.format(assert.messages.enum.default, 'tool', TOOLS));
                window.assert(MathGraphToolBar, this.toolBar, kendo.format(assert.messages.instanceof.default, 'this.toolBar', 'kendo.ui.MathGraphToolBar'));
                var buttonElement = this.toolBar.element.find(kendo.format(ATTRIBUTE_SELECTOR, kendo.attr('tool'), tool));
                this.toolBar.toggle(buttonElement, true);
                if (tool === 'select') {
                    this.wrapper.css({ cursor: 'default' });
                } else {
                    this.wrapper.css({ cursor: 'crosshair' });
                }
                this._tool = tool;
            },

            /* This function's cyclomatic complexity is too high. */
            /* jshint -W074 */

            /**
             * Event handler for triggering an action event from the toolbar
             * @param e
             * @private
             */
            _onToolBarAction: function (e) {
                switch (e.command) {
                    case 'PropertyChangeCommand':
                        switch (e.options.property) {
                            case 'tool':
                                this._setTool(e.options.value);
                                break;
                            case 'bold':
                            case 'italic':
                                this._configuration.fontStyle = e.options.property;
                                break;
                            case 'background':
                                this._configuration.fill.color = e.options.value;
                                break;
                            case 'color':
                                this._configuration.stroke.color = e.options.value;
                                break;
                            case 'fontSize':
                                this._configuration.font.fontSize = e.options.value;
                                break;
                            case 'fontFamily':
                                this._configuration.font.fontFamily = e.options.value;
                                break;
                        }
                        break;
                    default:
                        $.noop();
                }
            },

            /* jshint +W074 */

            /**
             * Event handler for triggering a dialog event from the toolbar
             * @param e
             * @private
             */
            _onToolBarDialog: function (e) {
                //  debugger;
            },

            /**
             * Init mouse events
             * @private
             */
            _initMouseEvents: function () {
                // IMPORTANT
                // We can have several containers containing connectors on a page
                // But we only have one set of event handlers shared across all containers
                // So we cannot use `this`, which is specific to this math graph
                var that = this;
                var data = {}; // We need an object so that data is passed by reference between handlers
                $(document).off(NS);
                if (that._enabled) {
                    $(document)
                        .on(MOUSEDOWN, WIDGET_SELECTOR, data, $.proxy(that._onMouseDown, that))
                        .on(MOUSEMOVE, WIDGET_SELECTOR, data, $.proxy(that._onMouseMove, that))
                        // TODO: test moving outside the boundaries of the widgets with several widgets on the page
                        // .on(MOUSEMOVE, data, $.proxy(that._onMouseMove, that))
                        .on(MOUSEUP, WIDGET_SELECTOR, data, $.proxy(that._onMouseUp, that))
                        .on(MOUSEUP, data, $.proxy(that._onMouseEnd, that));
                }
            },

            /**
             * Get mouse position in canvas coordinates
             * @param e
             * @private
             */
            _getMousePosition: function (e) {
                var element = $(e.currentTarget);
                var widget = element.data(WIDGET);
                assert.instanceof(MathGraph, widget, kendo.format(assert.messages.instanceof.default, 'widget', 'kendo.ui.MathGraph'));
                assert.equal(this, widget, kendo.format(assert.messages.equal.default, 'widget', 'this'));
                assert.ok(this._enabled, kendo.format(assert.messages.ok.default, 'this._enabled'));
                var scaler = element.closest(widget.options.scaler);
                var scale = scaler.length ? util.getTransformScale(scaler) : 1;
                var mouse = util.getMousePosition(e, element);
                return new geometry.Point(mouse.x / scale, mouse.y / scale);
            },

            /**
             * Find element at position
             * @param position
             * @private
             */
            _getElementAtPosition: function (position) {
                var elements = this.surface.exportVisual().children;
                var ret;
                // The last elements are on top of the others, so we loop from last to first
                for (var i = elements.length - 1; i >= 0; i--) {
                    var element = elements[i];
                    if (element instanceof drawing.Group && $.type(element.options.get('uid') === UNDEFINED)) {
                        // This is our handle group which should be discarded
                        continue;
                    }
                    // containsPoint does not work with shapes that have no fill color
                    // if (elements[i].containsPoint(position)) {
                    var bbox = element.clippedBBox();
                    if ((position.x >= bbox.origin.x) && (position.x <= bbox.origin.x + bbox.size.width) &&
                        (position.y >= bbox.origin.y) && (position.y <= bbox.origin.y + bbox.size.height)) {
                        ret = element;
                        break;
                    }
                }
                return ret;
            },


            /**
             * Select an element and display handles
             * @param element
             * @private
             */
            _select: function (element) {
                this._unselect();
                // TODO Review: Displaying handles is certainly not our best option!!!!!!!!!!!!!!!
                // Actually we can only select points
                if (element instanceof drawing.Element) {
                    // Note: we might also want to test that the element is on the surface
                    var size = 10;
                    var bbox = element.clippedBBox();
                    var group = new drawing.Group();
                    // bounding box
                    var rectGeometry = bbox;
                    var rect = new drawing.Rect(rectGeometry, this.options.bbox);
                    group.append(rect);
                    // top left handle
                    var position = bbox.topLeft();
                    rectGeometry = new geometry.Rect([position.x - size / 2, position.y - size / 2], [size, size]);
                    rect = new drawing.Rect(rectGeometry, this.options.handle);
                    group.append(rect);
                    // top right handle
                    position = bbox.topRight();
                    rectGeometry = new geometry.Rect([position.x - size / 2, position.y - size / 2], [size, size]);
                    rect = new drawing.Rect(rectGeometry, this.options.handle);
                    group.append(rect);
                    // bottom right handle
                    position = bbox.bottomRight();
                    rectGeometry = new geometry.Rect([position.x - size / 2, position.y - size / 2], [size, size]);
                    rect = new drawing.Rect(rectGeometry, this.options.handle);
                    group.append(rect);
                    // bottom left handle
                    position = bbox.bottomLeft();
                    rectGeometry = new geometry.Rect([position.x - size / 2, position.y - size / 2], [size, size]);
                    rect = new drawing.Rect(rectGeometry, this.options.handle);
                    group.append(rect);
                    this.surface.draw(group);
                    this._selection = {
                        element: element, // Note: we could consider an array to allow for multiple selections
                        handles: group
                    };
                }
            },

            /**
             * Unselect the current selection
             * @private
             */
            _unselect: function () {
                if ($.type(this._selection) !== UNDEFINED) {
                    // this.surface.exportVisual().children.pop();
                    // this.surface.resize(true);
                    this.refresh();
                    this._selection = undefined;
                }
            },

            /**
             * MouseDown event handler
             * @param e
             * @private
             */
            _onMouseDown: function (e) {
                window.console.log('_onMouseDown');
                var position = this._getMousePosition(e);
                switch (this._tool) {
                    case 'select':
                        // The surface click event and surface.eventTarget(e) won't work properly because our widget is scaled
                        var element = this._getElementAtPosition(position);
                        this._select(element);
                        break;
                    case 'point':
                        this._startPoint(position, e.data);
                        break;
                    // case 'line':
                    // case 'circle':
                    // TODO case 'function':
                    // TODO case 'text'
                }
            },

            /**
             * MouseDown event handler
             * @param e
             * @private
             */
            _onMouseMove: function (e) {
                // Discard mouse events unless there is e.data
                if ($.type(e.data) === OBJECT && !$.isEmptyObject(e.data)) {
                    window.console.log('_onMouseMove');
                    var position = this._getMousePosition(e);
                    switch (this._tool) {
                        case 'point':
                            this._continuePoint(position, e.data);
                            break;
                        /*
                        case 'pen':
                            this._continuePen(position, e.data);
                            break;
                        case 'rect':
                            this._continueRect(position, e.data);
                            break;
                        */
                    }
                }
            },

            /**
             * MouseUp event handler (within the widget boundaries)
             * Proceed with the current action
             * @param e
             * @private
             */
            _onMouseUp: function (e) {
                // Discard mouse events unless there is e.data
                if ($.type(e.data) === OBJECT && !$.isEmptyObject(e.data)) {
                    window.console.log('_onMouseUp');
                    var position = this._getMousePosition(e);
                    // Discard mouse events unless there is e.data
                    if ($.type(e.data) === OBJECT && !$.isEmptyObject(e.data)) {
                        switch (this._tool) {
                            case 'point':
                                this._endPoint(position, e.data);
                                break;
                            /*
                            case 'circle':
                                this._endCircle(position, e.data);
                                break;
                            case 'pen':
                                this._endPen(position, e.data);
                                break;
                            case 'rect':
                                this._endRect(position, e.data);
                                break;
                            */
                        }
                    }
                }
            },

            /**
             * MouseUp event handler (anywhere on the document)
             * Cancel the current action
             * @param e
             * @private
             */
            _onMouseEnd: function (e) {
                window.console.log('_onMouseEnd');
                // Reset data for next shape
                // We cannot assign a new object as in e.data = {}; we need to remove the properties on the object passed by reference
                for (var prop in e.data) {
                    if (e.data.hasOwnProperty(prop)) {
                        delete e.data[prop];
                    }
                }
                // Reset tool
                this._setTool('select');
            },

            /**
             * Start drawing a point with a mouse (MouseDown)
             * @param position
             * @param data
             * @private
             */
            _startPoint: function (position, data) {
                // DRAW THE POINT
                data.mousedown = true;
            },

            /**
             * Continue drawing a point with a mouse (MouseMove)
             * @param position
             * @param data
             * @private
             */
            _continuePoint: function (position, data) {
                // mOVE THE POINT
            },

            /**
             * End drawing a point with a mouse (MouseUp)
             * @param position
             * @param data
             * @private
             */
            _endPoint: function (position, data) {
                // Add the point to the dataSource and refresh
                var pt = this._getPointFromPixel({ x: position.x, y: position.y });
                this.dataSource.add({
                    type: 'point',
                    name: 'G', // TODO
                    x: pt.x,
                    y: pt.y,
                    configuration: this._configuration.toJSON()
                });
            },

            /**
             * _dataSource function to bind refresh to the change event
             * @private
             */
            _dataSource: function () {
                var that = this;

                // returns the datasource OR creates one if using array or configuration
                that.dataSource = DataSource.create(that.options.dataSource);

                // bind to the change event to refresh the widget
                if (that._refreshHandler) {
                    that.dataSource.unbind(CHANGE, that._refreshHandler);
                }
                that._refreshHandler = $.proxy(that.refresh, that);
                that.dataSource.bind(CHANGE, that._refreshHandler);

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

            /* This function's cyclomatic complexity is too high. */
            /* jshint -W074 */

            /**
             * Refresh upon changing the dataSource
             * Redraw all connections
             */
            refresh: function (e) {
                var that = this;
                assert.instanceof(DataSource, that.dataSource, kendo.format(assert.messages.instanceof.default, 'this.dataSource', 'kendo.data.DataSource'));
                if (that.surface instanceof Surface) {
                    var items = this.dataSource.data();
                    // Clear surface
                    that.surface.clear();
                    // Draw grid
                    that._drawGrid();
                    // Draw axis
                    that._drawAxis();
                    // Draw dataSource items
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        switch (item.type) {
                            case 'arc':
                                break;
                            case 'circle':
                                that._drawCircle(item);
                                break;
                            case 'function':
                                that._drawMathFunction(item);
                                break;
                            case 'line':
                                that._drawLine(item);
                                break;
                            case 'point':
                                that._drawPoint(item);
                                break;
                            case 'ray':
                                that._drawRay(item);
                                break;
                            case 'segment':
                                that._drawSegment(item);
                                break;
                        }
                    }
                }
            },

            /* jshint +W074 */

            /**
             * Draw grid
             * @private
             */
            _drawGrid: function () {
                var that = this;
                var element = that.element;
                var options = that.options;
                if (options.grid && options.grid.size) {
                    var height = element.height();
                    var width = element.width();
                    var origin = that._getOrigin();
                    var group = new Group();
                    var xSize = parseFloat(options.grid.size.x);
                    if (!isNaN(xSize) && xSize > 0) {
                        var xShift = origin.x % xSize;
                        var columns = width / xSize;
                        // TODO: because of xShift, we might need to start at -1
                        for (var c = 0; c < columns ; c++) {
                            var colPath = new Path(options.grid.path).moveTo(c * xSize + xShift, 0).lineTo(c * xSize + xShift, height);
                            group.append(colPath);
                        }
                    }
                    var ySize = parseFloat(options.grid.size.y);
                    if (!isNaN(ySize) && ySize > 0) {
                        var yShift = origin.y % ySize;
                        var rows = height / ySize;
                        for (var r = 0; r < rows ; r++) {
                            var rowPath = new Path(options.grid.path).moveTo(0, r * ySize + yShift).lineTo(width, r * ySize + yShift);
                            group.append(rowPath);
                        }
                    }
                    if ($.isArray(group.children) && group.children.length) {
                        that.surface.draw(group);
                    }
                }
            },

            /**
             * Get the graph origin
             * @private
             */
            _getOrigin: function () {
                var that = this;
                if (!$.isPlainObject(that._origin)) {
                    var element = that.element;
                    var options = that.options;
                    var height = element.height();
                    var width = element.width();
                    // Default value for origin (because we need one)
                    that._origin = {
                        x: width / 2,
                        y: height / 2
                    };
                    if (options.axis && options.axis.position) {
                        var x = parseFloat(options.axis.position.x);
                        if (!isNaN(x) && x >= 0 && x <= 100) {
                            that._origin.x = width * x / 100;
                        }
                        var y = parseFloat(options.axis.position.y);
                        if (!isNaN(y) && y >= 0 && y <= 100) {
                            that._origin.y = height * y / 100;
                        }
                    }
                }
                // Cache the value to avoid repeating the same calculation
                return that._origin;
            },

            /**
             * Get the pixel position from top left corner, given a point from origin
             * The point has math cooordinates considering the grid size and position of axis/origin
             * The position has pixel coordinates
             * @param point
             * @private
             */
            _getPixelFromPoint: function (point) {
                var that = this;
                var options = that.options;
                var xSize = parseFloat(options.grid.size.x);
                var ySize = parseFloat(options.grid.size.y);
                var origin = that._getOrigin();
                return {
                    x: point.x * xSize + origin.x,
                    y: -point.y * ySize + origin.y
                };
            },

            /**
             * Get the point from origin, gievn the pixel position from top left corner
             * The point has math cooordinates considering the grid size and position of axis/origin
             * The position has pixel coordinates
             * @param pixel
             * @private
             */
            _getPointFromPixel: function (pixel) {
                var that = this;
                var options = that.options;
                var xSize = parseFloat(options.grid.size.x);
                var ySize = parseFloat(options.grid.size.y);
                var origin = that._getOrigin();
                return {
                    x: (pixel.x - origin.x) / xSize,
                    y: (origin.y - pixel.y) / ySize
                };
            },

            /**
             * Draw axis
             * @private
             */
            _drawAxis: function () {
                var that = this;
                var options = that.options;
                if (options.axis && options.axis.position && options.axis.position.x && options.axis.position.y) {
                    var element = that.element;
                    var origin = that._getOrigin();
                    var height = element.height();
                    var width = element.width();
                    var group = new Group();
                    var xPath = new Path(options.axis.path).moveTo(0, origin.y).lineTo(width, origin.y);
                    group.append(xPath);

                    var yPath = new Path(options.axis.path).moveTo(origin.x, 0).lineTo(origin.x, height);
                    group.append(yPath);
                    that.surface.draw(group);
                    // TODO add end arrows
                    // TODO add graduations
                }
            },

            /**
             * Draw a point
             * @param dataItem
             * @private
             */
            _drawPoint: function (dataItem) {
                var that = this;
                var px = that._getPixelFromPoint({ x: dataItem.x, y: dataItem.y });
                if (isFinite(px.x) && isFinite(px.y)) {
                    var configuration = dataItem.configuration.toJSON();
                    var group = new Group();
                    // Outer circle
                    var circleGeometry = new geometry.Circle([px.x, px.y], 10); // TODO configure radius of 10
                    var circle = new drawing.Circle(circleGeometry, $.extend({}, configuration, { opacity: 0.25 }));
                    group.append(circle);
                    // Inner circle
                    circleGeometry = new geometry.Circle([px.x, px.y], 3); // TODO configure radius
                    circle = new drawing.Circle(circleGeometry, configuration);
                    group.append(circle);
                    // Add name
                    var text = new drawing.Text(dataItem.name, new geometry.Point(px.x + 10, px.y - 22));  // TODO configure font size and calculate position
                    group.append(text);
                    that.surface.draw(group);
                }
            },

            /**
             * Draw a segment
             * @param dataItem
             * @private
             */
            _drawSegment: function (dataItem) {
                var that = this;
                var pt1 = that.dataSource.get(dataItem.pt1);
                var pt2 = that.dataSource.get(dataItem.pt2);
                var px1 = that._getPixelFromPoint(pt1);
                var px2 = that._getPixelFromPoint(pt2);
                if (isFinite(px1.x) && isFinite(px1.y) &&
                    isFinite(px2.x) && isFinite(px2.y)
                ) {
                    var group = new Group();
                    // Add path
                    var path = new Path(dataItem.configuration.toJSON());
                    path.moveTo(px1.x, px1.y);
                    path.lineTo(px2.x, px2.y);
                    group.append(path);
                    // TODO Add dataItem.name
                    that.surface.draw(group);
                }
            },

            /**
             * Draw a ray starting at pt1 and going through pt2
             * @param dataItem
             * @private
             */
            _drawRay: function (dataItem) {
                var that = this;
                var height = that.element.height();
                var width = that.element.width();
                var pt1 = that.dataSource.get(dataItem.pt1);
                var pt2 = that.dataSource.get(dataItem.pt2);
                var px1 = that._getPixelFromPoint(pt1);
                var px2 = that._getPixelFromPoint(pt2);
                // Our line has the equation y = a*x + b in the pixel referential
                var a = (px2.y - px1.y) / (px2.x - px1.x);
                var b = px1.y - a * px1.x;
                var group = new Group();
                var path = new Path(dataItem.configuration.toJSON());
                if (px2.x > px1.x) {
                    path
                        .moveTo([px1.x, px1.y])
                        .lineTo([width, a * width + b]);
                } else if (px2.x < px1.x) {
                    path
                        .moveTo([0, b])
                        .lineTo([px1.x, px1.y]);
                } else if (px2.x === px1.x && px2.y < px2.x) {
                    path
                        .moveTo([px1.x, 0])
                        .lineTo([px1.x, px1.y]);
                } else if (px2.x === px1.x && px2.y > px2.x) {
                    path
                        .moveTo([px1.x, px1.y])
                        .lineTo([px1.x, height]);
                }
                group.append(path);
                // TODO Add dataItem.name
                that.surface.draw(group);
            },

            /**
             * Draw a line going through pt1 and pt2
             * @param dataItem
             * @private
             */
            _drawLine: function (dataItem) {
                var that = this;
                var width = that.element.width();
                var pt1 = that.dataSource.get(dataItem.pt1);
                var pt2 = that.dataSource.get(dataItem.pt2);
                var px1 = that._getPixelFromPoint(pt1);
                var px2 = that._getPixelFromPoint(pt2);
                // Our line has the equation y = a*x + b in the pixel referential
                var a = (px2.y - px1.y) / (px2.x - px1.x);
                var b = px1.y - a * px1.x;
                var group = new Group();
                var path = new Path(dataItem.configuration.toJSON());
                path
                    .moveTo([0, b])
                    .lineTo([width, a * width + b]);
                group.append(path);
                // TODO Add name
                that.surface.draw(group);
            },

            /**
             * Draw a circle centered at pt1 and going through pt2
             * @param dataItem
             * @private
             */
            _drawCircle: function (dataItem) {
                var that = this;
                var pt1 = that.dataSource.get(dataItem.pt1);
                var pt2 = that.dataSource.get(dataItem.pt2);
                var px1 = that._getPixelFromPoint(pt1);
                var px2 = that._getPixelFromPoint(pt2);
                if (isFinite(px1.x) && isFinite(px1.y) &&
                    isFinite(px2.x) && isFinite(px2.y)
                ) {
                    var radius = Math.sqrt(Math.pow(px2.x - px1.x, 2) + Math.pow(px2.y - px1.y, 2));
                    var group = new Group();
                    var circleGeometry = new geometry.Circle([px1.x, px1.y], radius);
                    var circle = new drawing.Circle(circleGeometry, dataItem.configuration.toJSON());
                    group.append(circle);
                    // TODO Add name
                    that.surface.draw(group);
                }
            },

            /**
             * Draw arc
             * @param dataItem
             * @private
             */
            _drawArc: function (dataItem) {

            },

            /**
             * Draw angle
             * assuming they are lines that intersect, path 1 and path 2 delimit 4 areas
             * pt1 is a point (mouse click) that designates one of the four areas and therefore the angle to draw
             * if path1 and path are segments or rays and their intersection define less than 4 areas, for example a V or a T
             * pt still designates the area where the angle should be drawn
             * if path1 and path 2 do not intersect within the boundaries of the visible surface, no angle is drawn
             * Note that possibly several lines, rays or segments can intersect at the same point
             * @param pt
             * @param path1
             * @param path2
             * @param name
             * @param configuration
             * @private
             */
            _drawAngle: function (pt, path1, path2, name, configuration) {
                // click 1: select path 1
                // click 2: select pt
                // click 3: select path 2
            },

            /**
             * Draw a radius
             * @param dataItem
             * @private
             */
            _drawRadius: function (dataItem) {
                // TODO
            },

            /* This function's cyclomatic complexity is too high. */
            /* jshint -W074 */

            /**
             * Draw math function
             * @param dataItem
             * @private
             */
            _drawMathFunction: function (dataItem) {
                assert.type(STRING, dataItem.code, kendo.format(assert.messages.type.default, 'code', STRING));
                var that = this;
                var element = that.element;
                var options = that.options;
                var xSize = parseFloat(options.grid.size.x);
                var ySize = parseFloat(options.grid.size.y);
                var origin = that._getOrigin();
                var width = element.width();
                var configuration = dataItem.configuration.toJSON();
                var group = new Group();
                var path = new Path(configuration);
                var which = false;
                var fn;
                var error;
                if ($.isFunction(math.Parser)) {
                    // we are using https://github.com/silentmatt/expr-eval
                    var parser = new math.Parser();
                    fn = parser.parse(dataItem.code);
                } else if ($.isFunction(math.parse)) {
                    // we are using https://github.com/josdejong/mathjs
                    which = true;
                    fn = math.parse(dataItem.code).compile();
                } else {
                    // we need a math parser
                    throw new Error('You need to reference a math parser');
                }
                for (var x = 0; x <= width; x++) {
                    try {
                        // x, y represent a pixel with 0,0 in the top left corner
                        // a, b are our coordinates from origin
                        var a = (x - origin.x) / xSize;
                        // Our function uses x but this is actually a, considering x refers to the horizontal position of pixels
                        var b = which ? fn.eval({ x: a }) : fn.evaluate({ x: a });
                        var y = -b * ySize + origin.y;
                        if (isFinite(y) && y >= 0 && y <= width) {
                            if (path.segments && path.segments.length === 0) {
                                path.moveTo(x, y);
                            } else {
                                path.lineTo(x, y);
                            }
                            if (x === width - 1) {
                                group.append(path);
                            }
                        } else { // Especially for 1/x and similar functions
                            // We only append to the group if we had one moveTo and at least one lineTo, that is 2 segments
                            if (path.segments && path.segments.length > 1) {
                                group.append(path);
                            }
                            // In all cases (whether the previous one has been added to the group or not), we start a new path
                            // Note: we could have used kendo.drawing.MultiPath
                            path = new Path(configuration);
                        }
                    } catch (ex) {
                        // TODO: handle parser errors !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                        error = new kendo.drawing.Text(ex.message, new geometry.Point(10, 10), configuration);
                        group.append(error);
                        break;
                    }
                }
                if ($.type(error) === UNDEFINED) {
                    // TODO Add name
                    var name = new kendo.drawing.Text(dataItem.name, new geometry.Point(10, 10), configuration);
                    group.append(name);
                    that.surface.draw(group);
                }
            },

            /* jshint +W074 */

            /**
             * Enable/disable user interactivity on connector
             */
            enable: function (enabled) {
                this._enabled = !!enabled;
                this._initMouseEvents();
            },

            /**
             * Destroys the widget
             * @method destroy
             */
            destroy: function () {
                var that = this;
                var element = that.element;
                // Unbind events
                $(document).off(NS);
                // Release references
                that.toolBar.destroy();
                that.toolBar.element.remove();
                that.toolBar = undefined;
                that.surface = undefined;
                // Destroy kendo
                Widget.fn.destroy.call(that);
                kendo.destroy(element);
                // Remove widget class
                element.removeClass(WIDGET_CLASS);
            }
        });

        kendo.ui.plugin(MathGraph);

        /*********************************************************************************
         * MathGraphToolBar Widget
         *********************************************************************************/

        var MESSAGES = {
            alignment: 'Alignment',
            alignmentButtons: {
                justtifyLeft: 'Align left',
                justifyCenter: 'Center',
                justifyRight: 'Align right',
                justifyFull: 'Justify',
                alignTop: 'Align top',
                alignMiddle: 'Align middle',
                alignBottom: 'Align bottom'
            },
            backgroundColor: 'Background',
            bold: 'Bold',
            borders: 'Borders',
            colorPicker: {
                reset: 'Reset color',
                customColor: 'Custom color...'
            },
            copy: 'Copy',
            cut: 'Cut',
            fontFamily: 'Font',
            fontSize: 'Font size',
            format: 'Custom format...',
            formatTypes: {
                automatic: 'Automatic',
                number: 'Number',
                percent: 'Percent',
                financial: 'Financial',
                currency: 'Currency',
                date: 'Date',
                time: 'Time',
                dateTime: 'Date time',
                duration: 'Duration',
                moreFormats: 'More formats...'
            },
            formatDecreaseDecimal: 'Decrease decimal',
            formatIncreaseDecimal: 'Increase decimal',
            italic: 'Italic',
            merge: 'Merge cells',
            mergeButtons: {
                mergeCells: 'Merge all',
                mergeHorizontally: 'Merge horizontally',
                mergeVertically: 'Merge vertically',
                unmerge: 'Unmerge'
            },
            open: 'Open...',
            paste: 'Paste',
            quickAccess: {
                redo: 'Redo',
                undo: 'Undo'
            },
            textColor: 'Text Color',
            textWrap: 'Wrap text',
            underline: 'Underline',
            validation: 'Data validation...',
            hyperlink: 'Link'
        };
        var toolDefaults = {
            separator: { type: 'separator' },
            select: {
                type: 'button',
                command: 'PropertyChangeCommand',
                group: 'tool',
                property: 'tool',
                value: 'select',
                iconClass: 'arrow-up',
                togglable: true
            },
            point: {
                type: 'button',
                command: 'PropertyChangeCommand',
                group: 'tool',
                property: 'tool',
                value: 'point',
                iconClass: 'circle',
                togglable: true
            },
            line: {
                type: 'button',
                command: 'PropertyChangeCommand',
                group: 'tool',
                property: 'tool',
                value: 'line',
                iconClass: 'shape-line',
                togglable: true
            },
            circle: {
                type: 'button',
                command: 'PropertyChangeCommand',
                group: 'tool',
                property: 'tool',
                value: 'circle',
                iconClass: 'shape-circle',
                togglable: true
            },
            function: {
                type: 'button',
                command: 'PropertyChangeCommand',
                group: 'tool',
                property: 'tool',
                value: 'function',
                iconClass: 'formula-fx',
                togglable: true
            },
            text: {
                type: 'button',
                command: 'PropertyChangeCommand',
                group: 'tool',
                property: 'tool',
                value: 'text',
                iconClass: 'font-family',
                togglable: true
            },
            bold: {
                type: 'button',
                command: 'PropertyChangeCommand',
                property: 'bold',
                value: true,
                iconClass: 'bold',
                togglable: true
            },
            italic: {
                type: 'button',
                command: 'PropertyChangeCommand',
                property: 'italic',
                value: true,
                iconClass: 'italic',
                togglable: true
            },
            backgroundColor: {
                type: 'colorPicker',
                property: 'background',
                iconClass: 'background'
            },
            textColor: {
                type: 'colorPicker',
                property: 'color',
                iconClass: 'foreground-color'
            },
            fontSize: {
                type: 'fontSize',
                property: 'fontSize',
                iconClass: 'font-size'
            },
            fontFamily: {
                type: 'fontFamily',
                property: 'fontFamily',
                iconClass: 'text'
            },
            alignment: {
                type: 'alignment',
                iconClass: 'align-left'
            }
        };

        var MathGraphToolBar = ToolBar.extend({
            init: function (element, options) {
                options = options || {};
                options.items = this._expandTools(options.tools || MathGraphToolBar.prototype.options.tools);
                ToolBar.fn.init.call(this, element, options);
                var handleClick = this._click.bind(this);
                this.element.addClass('k-spreadsheet-toolbar');
                this._addSeparators(this.element);
                this.bind({
                    click: handleClick,
                    toggle: handleClick
                });
            },
            _addSeparators: function (element) {
                var groups = element.children('.k-widget, a.k-button, .k-button-group');
                groups.before('<span class=\'k-separator\' />');
            },

            /* This function's cyclomatic complexity is too high. */
            /* jshint -W074 */

            _expandTools: function (tools) {
                function expandTool(toolName) {
                    var options = $.isPlainObject(toolName) ? toolName : toolDefaults[toolName] || {};
                    var spriteCssClass = 'k-icon k-font-icon k-i-' + options.iconClass;
                    var type = options.type;
                    var typeDefaults = {
                        splitButton: { spriteCssClass: spriteCssClass },
                        button: { showText: 'overflow' },
                        colorPicker: { toolIcon: spriteCssClass }
                    };
                    var tool = $.extend({
                        name: options.name || toolName,
                        text: MESSAGES[options.name || toolName],
                        spriteCssClass: spriteCssClass,
                        attributes: { title: MESSAGES[options.name || toolName] }
                    }, typeDefaults[type], options);
                    if (type === 'splitButton') {
                        tool.menuButtons = tool.menuButtons.map(expandTool);
                    }
                    tool.attributes[kendo.attr('tool')] = toolName;
                    if (options.property) {
                        tool.attributes[kendo.attr('property')] = options.property;
                    }
                    return tool;
                }
                return tools.reduce(function (tools, tool) {
                    if ($.isArray(tool)) {
                        tools.push({
                            type: 'buttonGroup',
                            buttons: tool.map(expandTool)
                        });
                    } else {
                        tools.push(expandTool.call(this, tool));
                    }
                    return tools;
                }, []);
            },

            /* jshint +W074 */

            _click: function (e) {
                var toolName = e.target.attr(kendo.attr('tool'));
                var tool = toolDefaults[toolName] || {};
                var commandType = tool.command;
                if (!commandType) {
                    return;
                }
                var args = {
                    command: commandType,
                    options: {
                        property: tool.property || null,
                        value: tool.value || null
                    }
                };
                if (typeof args.options.value === 'boolean') {
                    args.options.value = e.checked ? true : null;
                }
                this.action(args);
            },
            events: [
                'click',
                'toggle',
                'open',
                'close',
                'overflowOpen',
                'overflowClose',
                'action',
                'dialog'
            ],
            options: {
                name: 'MathGraphToolBar',
                resizable: false,
                tools: TOOLBAR
            },
            action: function (args) {
                this.trigger('action', args);
            },
            dialog: function (args) {
                this.trigger('dialog', args);
            },
            refresh: function (activeCell) {
                var range = activeCell;
                var tools = this._tools();
                function setToggle(tool, value) {
                    var toolbar = tool.toolbar;
                    var overflow = tool.overflow;
                    var togglable = toolbar && toolbar.options.togglable || overflow && overflow.options.togglable;
                    if (!togglable) {
                        return;
                    }
                    var toggle = false;
                    if (typeof value === 'boolean') {
                        toggle = value;
                    } else if (typeof value === 'string') {
                        toggle = toolbar.options.value === value;
                    }
                    toolbar.toggle(toggle);
                    if (overflow) {
                        overflow.toggle(toggle);
                    }
                }
                function update(tool, value) {
                    var toolbar = tool.toolbar;
                    var overflow = tool.overflow;
                    if (toolbar && toolbar.update) {
                        toolbar.update(value);
                    }
                    if (overflow && overflow.update) {
                        overflow.update(value);
                    }
                }
                for (var i = 0; i < tools.length; i++) {
                    var property = tools[i].property;
                    var tool = tools[i].tool;
                    var value = kendo.isFunction(range[property]) ? range[property]() : range;
                    if (property === 'gridLines') {
                        value = range.sheet().showGridLines();
                    }
                    if (tool.type === 'button') {
                        setToggle(tool, value);
                    } else {
                        update(tool, value);
                    }
                }
            },
            _tools: function () {
                return this.element.find('[' + kendo.attr('property') + ']').toArray().map(function (element) {
                    element = $(element);
                    return {
                        property: element.attr('data-property'),
                        tool: this._getItem(element)
                    };
                }.bind(this));
            },
            destroy: function () {
                this.element.find('[data-command],.k-button').each(function () {
                    var element = $(this);
                    var instance = element.data('instance');
                    if (instance && instance.destroy) {
                        instance.destroy();
                    }
                });
                ToolBar.fn.destroy.call(this);
            }
        });

        kendo.ui.plugin(MathGraphToolBar);

        /*********************************************************************************
         * MathGraphToolBar Tools
         *********************************************************************************/

        var DropDownTool = kendo.toolbar.Item.extend({
            init: function (options, toolbar) {
                var dropDownList = $('<select />').kendoDropDownList({ height: 'auto' }).data('kendoDropDownList');
                this.dropDownList = dropDownList;
                this.element = dropDownList.wrapper;
                this.options = options;
                this.toolbar = toolbar;
                this.attributes();
                this.addUidAttr();
                this.addOverflowAttr();
                dropDownList.bind('open', this._open.bind(this));
                dropDownList.bind('change', this._change.bind(this));
                this.element.width(options.width).attr({
                    'data-command': 'PropertyChangeCommand',
                    'data-property': options.property
                });
            },
            _open: function () {
                var ddl = this.dropDownList;
                var list = ddl.list;
                var listWidth;
                list.css({
                    whiteSpace: 'nowrap',
                    width: 'auto'
                });
                listWidth = list.width();
                if (listWidth) {
                    listWidth += 20;
                } else {
                    listWidth = ddl._listWidth;
                }
                list.css('width', listWidth + kendo.support.scrollbar());
                ddl._listWidth = listWidth;
            },
            _change: function (e) {
                var instance = e.sender;
                var value = instance.value();
                var dataItem = instance.dataItem();
                var popupName = dataItem ? dataItem.popup : undefined;
                if (popupName) {
                    this.toolbar.dialog({ name: popupName });
                } else {
                    this.toolbar.action({
                        command: 'PropertyChangeCommand',
                        options: {
                            property: this.options.property,
                            value: value === 'null' ? null : value
                        }
                    });
                }
            },
            value: function (value) {
                if (value !== undefined) {
                    this.dropDownList.value(value);
                } else {
                    return this.dropDownList.value();
                }
            }
        });
        var PopupTool = kendo.toolbar.Item.extend({
            init: function (options, toolbar) {
                this.element = $('<a href=\'#\' class=\'k-button k-button-icon\'>' + '<span class=\'' + options.spriteCssClass + '\'>' + '</span><span class=\'k-icon k-i-arrow-s\'></span>' + '</a>');
                this.element.on('click touchend', this.open.bind(this)).attr('data-command', options.command);
                this.options = options;
                this.toolbar = toolbar;
                this.attributes();
                this.addUidAttr();
                this.addOverflowAttr();
                this._popup();
            },
            destroy: function () {
                this.popup.destroy();
            },
            open: function (ev) {
                ev.preventDefault();
                this.popup.toggle();
            },
            _popup: function () {
                var element = this.element;
                this.popup = $('<div class=\'k-spreadsheet-popup\' />').appendTo(element).kendoPopup({ anchor: element }).data('kendoPopup');
            }
        });

        /*
         kendo.toolbar.registerComponent('dialog', kendo.toolbar.ToolBarButton.extend({
         init: function (options, toolbar) {
         kendo.toolbar.ToolBarButton.fn.init.call(this, options, toolbar);
         this._dialogName = options.dialogName;
         this.element.bind('click touchend', this.open.bind(this)).data('instance', this);
         },
         open: function () {
         this.toolbar.dialog({ name: this._dialogName });
         }
         }));
         kendo.toolbar.registerComponent('exportAsDialog', kendo.toolbar.Item.extend({
         init: function (options, toolbar) {
         this._dialogName = options.dialogName;
         this.toolbar = toolbar;
         this.element = $('<button class=\'k-button k-button-icon\' title=\'' + options.attributes.title + '\'>' + '<span class=\'k-icon k-font-icon k-i-xls\' />' + '</button>').data('instance', this);
         this.element.bind('click', this.open.bind(this)).data('instance', this);
         },
         open: function () {
         this.toolbar.dialog({ name: this._dialogName });
         }
         }));
         */

        var OverflowDialogButton = kendo.toolbar.OverflowButton.extend({
            init: function (options, toolbar) {
                kendo.toolbar.OverflowButton.fn.init.call(this, options, toolbar);
                this.element.on('click touchend', this._click.bind(this));
                this.message = this.options.text;
                var instance = this.element.data('button');
                this.element.data(this.options.type, instance);
            },
            _click: $.noop
        });

        // Color Picker
        /*
         var ColorPicker = PopupTool.extend({
         init: function (options, toolbar) {
         PopupTool.fn.init.call(this, options, toolbar);
         this.popup.element.addClass('k-spreadsheet-colorpicker');
         this.colorChooser = new kendo.spreadsheet.ColorChooser(this.popup.element, { change: this._colorChange.bind(this) });
         this.element.attr({ 'data-property': options.property });
         this.element.data({
         type: 'colorPicker',
         colorPicker: this,
         instance: this
         });
         },
         destroy: function () {
         this.colorChooser.destroy();
         PopupTool.fn.destroy.call(this);
         },
         update: function (value) {
         this.value(value);
         },
         value: function (value) {
         this.colorChooser.value(value);
         },
         _colorChange: function (e) {
         this.toolbar.action({
         command: 'PropertyChangeCommand',
         options: {
         property: this.options.property,
         value: e.sender.value()
         }
         });
         this.popup.close();
         }
         });
         var ColorPickerButton = OverflowDialogButton.extend({
         init: function (options, toolbar) {
         options.iconName = 'text';
         OverflowDialogButton.fn.init.call(this, options, toolbar);
         },
         _click: function () {
         this.toolbar.dialog({
         name: 'colorPicker',
         options: {
         title: this.options.property,
         property: this.options.property
         }
         });
         }
         });
         kendo.toolbar.registerComponent('colorPicker', ColorPicker, ColorPickerButton);
         */

        // Font sizes
        var FONT_SIZES = [
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            16,
            18,
            20,
            22,
            24,
            26,
            28,
            36,
            48,
            72
        ];
        var DEFAULT_FONT_SIZE = 12;
        var FontSize = kendo.toolbar.Item.extend({
            init: function (options, toolbar) {
                var comboBox = $('<input />').kendoComboBox({
                    change: this._valueChange.bind(this),
                    clearButton: false,
                    dataSource: options.fontSizes || FONT_SIZES,
                    value: DEFAULT_FONT_SIZE
                }).data('kendoComboBox');
                this.comboBox = comboBox;
                this.element = comboBox.wrapper;
                this.options = options;
                this.toolbar = toolbar;
                this.attributes();
                this.addUidAttr();
                this.addOverflowAttr();
                this.element.width(options.width).attr({
                    'data-command': 'PropertyChangeCommand',
                    'data-property': options.property
                });
                this.element.data({
                    type: 'fontSize',
                    fontSize: this
                });
            },
            _valueChange: function (e) {
                this.toolbar.action({
                    command: 'PropertyChangeCommand',
                    options: {
                        property: this.options.property,
                        value: kendo.parseInt(e.sender.value())
                    }
                });
            },
            update: function (value) {
                this.value(kendo.parseInt(value) || DEFAULT_FONT_SIZE);
            },
            value: function (value) {
                if (value !== undefined) {
                    this.comboBox.value(value);
                } else {
                    return this.comboBox.value();
                }
            }
        });
        var FontSizeButton = OverflowDialogButton.extend({
            _click: function () {
                this.toolbar.dialog({
                    name: 'fontSize',
                    options: {
                        sizes: FONT_SIZES,
                        defaultSize: DEFAULT_FONT_SIZE
                    }
                });
            },
            update: function (value) {
                this._value = value || DEFAULT_FONT_SIZE;
                this.element.find('.k-text').text(this.message + ' (' + this._value + ') ...');
            }
        });
        kendo.toolbar.registerComponent('fontSize', FontSize, FontSizeButton);

        // Font families
        var FONT_FAMILIES = [
            'Arial',
            'Courier New',
            'Georgia',
            'Times New Roman',
            'Trebuchet MS',
            'Verdana'
        ];
        var DEFAULT_FONT_FAMILY = 'Arial';
        var FontFamily = DropDownTool.extend({
            init: function (options, toolbar) {
                DropDownTool.fn.init.call(this, options, toolbar);
                var ddl = this.dropDownList;
                ddl.setDataSource(options.fontFamilies || FONT_FAMILIES);
                ddl.value(DEFAULT_FONT_FAMILY);
                this.element.data({
                    type: 'fontFamily',
                    fontFamily: this
                });
            },
            update: function (value) {
                this.value(value || DEFAULT_FONT_FAMILY);
            }
        });
        var FontFamilyButton = OverflowDialogButton.extend({
            _click: function () {
                this.toolbar.dialog({
                    name: 'fontFamily',
                    options: {
                        fonts: FONT_FAMILIES,
                        defaultFont: DEFAULT_FONT_FAMILY
                    }
                });
            },
            update: function (value) {
                this._value = value || DEFAULT_FONT_FAMILY;
                this.element.find('.k-text').text(this.message + ' (' + this._value + ') ...');
            }
        });
        kendo.toolbar.registerComponent('fontFamily', FontFamily, FontFamilyButton);

        // border
        /*
         var BorderChangeTool = PopupTool.extend({
         init: function (options, toolbar) {
         PopupTool.fn.init.call(this, options, toolbar);
         this._borderPalette();
         this.element.data({
         type: 'borders',
         instance: this
         });
         },
         destroy: function () {
         this.borderPalette.destroy();
         PopupTool.fn.destroy.call(this);
         },
         _borderPalette: function () {
         var element = $('<div />').appendTo(this.popup.element);
         this.borderPalette = new kendo.spreadsheet.BorderPalette(element, { change: this._action.bind(this) });
         },
         _action: function (e) {
         this.toolbar.action({
         command: 'BorderChangeCommand',
         options: {
         border: e.type,
         style: {
         size: 1,
         color: e.color
         }
         }
         });
         }
         });
         var BorderChangeButton = OverflowDialogButton.extend({
         _click: function () {
         this.toolbar.dialog({ name: 'borders' });
         }
         });
         kendo.toolbar.registerComponent('borders', BorderChangeTool, BorderChangeButton);
         */

        // Alignment
        /*
         var AlignmentTool = PopupTool.extend({
         init: function (options, toolbar) {
         PopupTool.fn.init.call(this, options, toolbar);
         this.element.attr({ 'data-property': 'alignment' });
         this._commandPalette();
         this.popup.element.on('click', '.k-button', function (e) {
         this._action($(e.currentTarget));
         }.bind(this));
         this.element.data({
         type: 'alignment',
         alignment: this,
         instance: this
         });
         },
         buttons: [
         {
         property: 'textAlign',
         value: 'left',
         iconClass: 'justify-left',
         text: MESSAGES.alignmentButtons.justtifyLeft
         },
         {
         property: 'textAlign',
         value: 'center',
         iconClass: 'justify-center',
         text: MESSAGES.alignmentButtons.justifyCenter
         },
         {
         property: 'textAlign',
         value: 'right',
         iconClass: 'justify-right',
         text: MESSAGES.alignmentButtons.justifyRight
         },
         {
         property: 'textAlign',
         value: 'justify',
         iconClass: 'justify-full',
         text: MESSAGES.alignmentButtons.justifyFull
         },
         {
         property: 'verticalAlign',
         value: 'top',
         iconClass: 'align-top',
         text: MESSAGES.alignmentButtons.alignTop
         },
         {
         property: 'verticalAlign',
         value: 'center',
         iconClass: 'align-middle',
         text: MESSAGES.alignmentButtons.alignMiddle
         },
         {
         property: 'verticalAlign',
         value: 'bottom',
         iconClass: 'align-bottom',
         text: MESSAGES.alignmentButtons.alignBottom
         }
         ],
         destroy: function () {
         this.popup.element.off();
         PopupTool.fn.destroy.call(this);
         },
         update: function (range) {
         var textAlign = range.textAlign();
         var verticalAlign = range.verticalAlign();
         var element = this.popup.element;
         element.find('.k-button').removeClass('k-state-active');
         if (textAlign) {
         element.find('[data-property=textAlign][data-value=' + textAlign + ']').addClass('k-state-active');
         }
         if (verticalAlign) {
         element.find('[data-property=verticalAlign][data-value=' + verticalAlign + ']').addClass('k-state-active');
         }
         },
         _commandPalette: function () {
         var buttons = this.buttons;
         var element = $('<div />').appendTo(this.popup.element);
         buttons.forEach(function (options, index) {
         var button = '<a title=\'' + options.text + '\' data-property=\'' + options.property + '\' data-value=\'' + options.value + '\' class=\'k-button k-button-icon\'>' + '<span class=\'k-icon k-font-icon k-i-' + options.iconClass + '\'></span>' + '</a>';
         if (index !== 0 && buttons[index - 1].property !== options.property) {
         element.append($('<span class=\'k-separator\' />'));
         }
         element.append(button);
         });
         },
         _action: function (button) {
         var property = button.attr('data-property');
         var value = button.attr('data-value');
         this.toolbar.action({
         command: 'PropertyChangeCommand',
         options: {
         property: property,
         value: value
         }
         });
         }
         });
         var AlignmentButton = OverflowDialogButton.extend({
         _click: function () {
         this.toolbar.dialog({ name: 'alignment' });
         }
         });
         kendo.toolbar.registerComponent('alignment', AlignmentTool, AlignmentButton);
         */


    }(window.jQuery));

    /* jshint +W071 */

    return window.kendo;

}, typeof define === 'function' && define.amd ? define : function (_, f) { 'use strict'; f(); });
