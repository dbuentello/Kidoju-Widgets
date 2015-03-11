/**
 * Copyright (c) 2013-2015 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* jshint browser: true, jquery: true, mocha: true, expr: true */

;(function (window, $, undefined) {

    'use strict';

    var expect = window.chai.expect,
        sinon = window.sinon,
        kendo = window.kendo,
        kidoju = window.kidoju,
        FIXTURES = '#fixtures',
        STAGE1 = '<div></div>',
        STAGE2 = '<div data-role="stage" data-bind="source: components, value: current" data-mode="design"></div>';

    var pageComponentCollectionData = [
        { id: kendo.guid(), tool : 'image', top: 50, left: 100, height: 250, width: 250, rotate: 45, attributes: { src: 'http://marketingland.com/wp-content/ml-loads/2013/04/google-g-logo-2012.png' } },
        { id: kendo.guid(), tool : 'image', top: 300, left: 300, height: 250, width: 250, rotate: 315, attributes: { src: 'http://4.bp.blogspot.com/_cPxcXn8pqkM/TCoCrLc7mVI/AAAAAAAABF0/8d6paccQU8A/s320/228_facebook.jpg' } },
        { id: kendo.guid(), tool : 'label', top: 250, left: 500, height: 100, width: 300, rotate: 90, attributes: { style: 'font-family: Georgia, serif; color: #FF0000;', text: 'World' } },
        { id: kendo.guid(), tool : 'textbox', top: 20, left: 20, height: 100, width: 300, rotate: 0, attributes: {}, properties: { name: 'textfield3' } }
    ];

    function findCenter( elem ) {
        var offset,
            document = $( elem.ownerDocument );
        elem = $( elem );
        offset = elem.offset();

        return {
            x: offset.left + elem.outerWidth() / 2 - document.scrollLeft(),
            y: offset.top + elem.outerHeight() / 2 - document.scrollTop()
        };
    }

    describe('kidoju.widgets.stage', function() {

        before(function() {
            if (window.__karma__ && $(FIXTURES).length === 0) {
                $('body').append('<div id="fixtures"></div>');
            }
        });

        describe('Availability', function() {

            it('requirements', function() {
                expect($).not.to.be.undefined;
                expect(kendo).not.to.be.undefined;
                expect(kendo.version).to.be.a('string');
                expect(kidoju).not.to.be.undefined;
                expect(kidoju.tools).not.to.be.undefined;
                expect(kidoju.Page).not.to.be.undefined;
                expect(kidoju.PageComponent).not.to.be.undefined;
                expect($.fn.kendoStage).to.be.an.instanceof(Function);
            });

        });

        describe('Initialization', function() {

            it('from code', function() {
                var element = $(STAGE1).appendTo(FIXTURES),
                    stage = element.kendoStage().data('kendoStage');
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(0);
                expect(element.parent()).to.have.class('k-widget');
                expect(element.parent()).to.have.class('kj-stage');
                expect(stage.mode()).to.equal(kendo.ui.Stage.fn.modes.thumbnail);
                //expect(stage.wrapper).to.equal(element.parent());
                expect(stage.wrapper[0]).to.equal(element.parent()[0]);
                expect(stage.wrapper).to.have.descendants('div[data-role="stage"]');
                expect(stage.wrapper).to.have.descendants('div.kj-overlay');
            });

            it('from code with dataSource in thumbnail mode', function() {
                var element = $(STAGE1).appendTo(FIXTURES),
                    stage = element.kendoStage({
                        mode: kendo.ui.Stage.fn.modes.thumbnail,
                        dataSource: new kidoju.PageComponentCollectionDataSource({ data: pageComponentCollectionData })
                    }).data('kendoStage');
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.mode()).to.equal(kendo.ui.Stage.fn.modes.thumbnail);
                //expect(stage.wrapper).to.equal(element.parent());
                expect(stage.wrapper[0]).to.equal(element.parent()[0]);
                expect(stage.wrapper).to.have.class('k-widget');
                expect(stage.wrapper).to.have.class('kj-stage');
                expect(stage.wrapper).to.have.descendants('div[data-role="stage"]');
                expect(stage.wrapper).to.have.descendants('div.kj-overlay');          //<------------------------- in thumbnail mode, there is an overlay
                expect(stage.wrapper).not.to.have.descendants('div.kj-handle-box');   //<------------------------- in thumbnail mode, there is no handle box (with handles)
                expect($(document.body)).not.to.have.descendants('ul.kj-stage-menu'); //<------------------------- in thumbnail mode, there is no contextual menu
                expect(stage.menu).to.be.undefined;
                var items = element.find('div.kj-element');
                expect(items).to.be.an.instanceof($).with.property('length', pageComponentCollectionData.length);
                $.each(items, function(index, item) {
                    var data = stage.dataSource.at(index);
                    expect($(item).attr(kendo.attr('uid'))).to.equal(data.uid);
                    expect($(item).attr(kendo.attr('tool'))).to.equal(data.tool);
                    expect($(item).css('position')).to.equal('absolute');
                    expect($(item).css('top')).to.equal(data.top + 'px');
                    expect($(item).css('left')).to.equal(data.left + 'px');
                    expect($(item).css('height')).to.equal(data.height + 'px');
                    expect($(item).css('width')).to.equal(data.width + 'px');
                    //TODO we would need a function to convert a 2D transform matrix into a rotation angle
                    //expect($(item).css('transform')).to.equal(kendo.format('rotate({0})deg', data.rotate));
                });
            });

            it('from code with dataSource in design mode', function() {
                var element = $(STAGE1).appendTo(FIXTURES),
                    stage = element.kendoStage({
                        mode: kendo.ui.Stage.fn.modes.design,
                        dataSource: new kidoju.PageComponentCollectionDataSource({ data: pageComponentCollectionData })
                    }).data('kendoStage');
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.mode()).to.equal(kendo.ui.Stage.fn.modes.design);
                //expect(stage.wrapper).to.equal(element.parent());
                expect(stage.wrapper[0]).to.equal(element.parent()[0]);
                expect(stage.wrapper).to.have.class('k-widget');
                expect(stage.wrapper).to.have.class('kj-stage');
                expect(stage.wrapper).to.have.descendants('div[data-role="stage"]');
                expect(stage.wrapper).not.to.have.descendants('div.kj-overlay'); //<------------------------- in design mode, there is no overlay
                expect(stage.wrapper).to.have.descendants('div.kj-handle-box');  //<------------------------- in design mode, there is a handle box (with handles)
                //expect(stage.wrapper).to.have.descendants('div.debug-bounds');
                //expect(stage.wrapper).to.have.descendants('div.debug.center');
                //expect(stage.wrapper).to.have.descendants('div.debug-mouse');
                expect($(document.body)).to.have.descendants('ul.kj-stage-menu'); //<------------------------- in thumbnail mode, there is a contextual menu
                expect(stage.menu).to.be.an.instanceof(kendo.ui.ContextMenu);
                var items = element.find('div.kj-element');
                expect(items).to.be.an.instanceof($).with.property('length', pageComponentCollectionData.length);
                $.each(items, function(index, item) {
                    var data = stage.dataSource.at(index);
                    expect($(item).attr(kendo.attr('uid'))).to.equal(data.uid);
                    expect($(item).attr(kendo.attr('tool'))).to.equal(data.tool);
                    expect($(item).css('position')).to.equal('absolute');
                    expect($(item).css('top')).to.equal(data.top + 'px');
                    expect($(item).css('left')).to.equal(data.left + 'px');
                    expect($(item).css('height')).to.equal(data.height + 'px');
                    expect($(item).css('width')).to.equal(data.width + 'px');
                    //TODO we would need a function to convert a 2D transform matrix into a rotation angle
                    //expect($(item).css('transform')).to.equal(kendo.format('rotate({0})deg', data.rotate));
                });
            });

            it('from code with dataSource in play mode', function() {
                var element = $(STAGE1).appendTo(FIXTURES),
                    stage = element.kendoStage({
                        mode: kendo.ui.Stage.fn.modes.play,
                        dataSource: new kidoju.PageComponentCollectionDataSource({ data: pageComponentCollectionData })
                    }).data('kendoStage');
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.mode()).to.equal(kendo.ui.Stage.fn.modes.play);
                //expect(stage.wrapper).to.equal(element.parent());
                expect(stage.wrapper[0]).to.equal(element.parent()[0]);
                expect(stage.wrapper).to.have.class('k-widget');
                expect(stage.wrapper).to.have.class('kj-stage');
                expect(stage.wrapper).to.have.descendants('div[data-role="stage"]');
                expect(stage.wrapper).not.to.have.descendants('div.kj-overlay');      //<------------------------- in play mode, there is no overlay
                expect(stage.wrapper).not.to.have.descendants('div.kj-handle-box');   //<------------------------- in play mode, there is no handle box (with handles)
                expect($(document.body)).not.to.have.descendants('ul.kj-stage-menu'); //<------------------------- in play mode, there is no contextual menu
                expect(stage.menu).to.be.undefined;
                var items = element.find('div.kj-element');
                expect(items).to.be.an.instanceof($).with.property('length', pageComponentCollectionData.length);
                $.each(items, function(index, item) {
                    var data = stage.dataSource.at(index);
                    expect($(item).attr(kendo.attr('uid'))).to.equal(data.uid);
                    expect($(item).attr(kendo.attr('tool'))).to.equal(data.tool);
                    expect($(item).css('position')).to.equal('absolute');
                    expect($(item).css('top')).to.equal(data.top + 'px');
                    expect($(item).css('left')).to.equal(data.left + 'px');
                    expect($(item).css('height')).to.equal(data.height + 'px');
                    expect($(item).css('width')).to.equal(data.width + 'px');
                    //TODO we would need a function to convert a 2D transform matrix into a rotation angle
                    //expect($(item).css('transform')).to.equal(kendo.format('rotate({0})deg', data.rotate));
                });
            });

            it('from markup', function() {
                var viewModel = kendo.observable({
                        components: new kidoju.PageComponentCollectionDataSource({ data: pageComponentCollectionData }),
                        current: undefined
                    }),
                    element = $(STAGE2).appendTo(FIXTURES);
                kendo.bind(FIXTURES, viewModel);
                var stage = element.data('kendoStage');
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.mode()).to.equal(kendo.ui.Stage.fn.modes.design);
                //expect(stage.wrapper).to.equal(element.parent());
                expect(stage.wrapper[0]).to.equal(element.parent()[0]);
                expect(stage.wrapper).to.have.class('k-widget');
                expect(stage.wrapper).to.have.class('kj-stage');
                expect(stage.wrapper).to.have.descendants('div[data-role="stage"]');
                expect(stage.wrapper).not.to.have.descendants('div.kj-overlay'); //<------------------------- in design mode, there is no overlay
                expect(stage.wrapper).to.have.descendants('div.kj-handle-box');  //<------------------------- in design mode, there is a handle box (with handles)
                var items = element.find('div.kj-element');
                expect(items).to.be.an.instanceof($).with.property('length', pageComponentCollectionData.length);
                $.each(items, function(index, item) {
                    var component = stage.dataSource.at(index);
                    expect($(item).attr(kendo.attr('uid'))).to.equal(component.uid);
                    expect($(item).attr(kendo.attr('tool'))).to.equal(component.tool);
                    expect($(item).css('position')).to.equal('absolute');
                    expect($(item).css('top')).to.equal(component.top + 'px');
                    expect($(item).css('left')).to.equal(component.left + 'px');
                    expect($(item).css('height')).to.equal(component.height + 'px');
                    expect($(item).css('width')).to.equal(component.width + 'px');
                    //TODO we would need a function to convert a 2D transform matrix into a rotation angle
                    //expect($(item).css('transform')).to.equal(kendo.format('rotate({0})deg', component.rotate));
                });
            });
        });

        describe('Methods', function() {

            var element, stage;

            beforeEach(function() {
                element = $(STAGE1).appendTo(FIXTURES);
                stage = element.kendoStage({
                    dataSource: pageComponentCollectionData,
                    mode: kendo.ui.Stage.fn.modes.design
                }).data('kendoStage');
            });

            it('length', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.length()).to.equal(pageComponentCollectionData.length);
            });

            it('items', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                var items = stage.items();
                expect(items).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length);
                var check = sinon.spy();
                $.each(items, function (index, item) {
                    check();
                    expect($(item)).to.match('div');
                    expect($(item)).to.have.class('kj-element');
                    expect($(item)).to.have.attr(kendo.attr('uid'));
                });
                expect(check).to.have.callCount(pageComponentCollectionData.length);
            });

            it('value', function() {
                var fn = function() {
                    stage.value(0);
                };
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(fn).to.throw(TypeError);
                for (var idx = 0; idx < pageComponentCollectionData.length; idx++) {
                    var component = stage.dataSource.at(idx);
                    stage.value(component);
                    expect(stage.index()).to.equal(idx);
                    expect(stage.id()).to.equal(component.id);
                }
            });

            it('index', function() {
                var fn1 = function() {
                    stage.index('not a number');
                };
                var fn2 = function() {
                    stage.index(300); //not in range
                };
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(fn1).to.throw(TypeError);
                expect(fn2).to.throw(RangeError);
                for (var idx = 0; idx < pageComponentCollectionData.length; idx++) {
                    var component = stage.dataSource.at(idx);
                    stage.index(idx);
                    expect(stage.value()).to.equal(component);
                    expect(stage.id()).to.equal(component.id);
                }
            });

            it('id', function() {
                var fn = function() {
                    stage.id({});
                };
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(fn).to.throw(TypeError);
                for (var idx = 0; idx < pageComponentCollectionData.length; idx++) {
                    var component = stage.dataSource.at(idx);
                    stage.id(component.id);
                    expect(stage.value()).to.equal(component);
                    expect(stage.index()).to.equal(idx);
                }
            });

            it('mode', function() {
                var fn1 = function() {
                    stage.mode({});
                };
                var fn2 = function() {
                    stage.mode('dummay');
                };
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.mode()).to.equal(kendo.ui.Stage.fn.modes.design);
                expect(stage.menu).to.be.an.instanceof(kendo.ui.ContextMenu);
                expect(fn1).to.throw(TypeError);
                expect(fn2).to.throw(RangeError);

            });

            it('height', function() {
                var fn1 = function() {
                    stage.height({});
                };
                var fn2 = function() {
                    stage.height(-1);
                };
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.height()).to.equal(stage.options.height);
                expect(fn1).to.throw(TypeError);
                expect(fn2).to.throw(RangeError);
            });

            it('width', function() {
                var fn1 = function() {
                    stage.width({});
                };
                var fn2 = function() {
                    stage.width(-1);
                };
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.width()).to.equal(stage.options.width);
                expect(fn1).to.throw(TypeError);
                expect(fn2).to.throw(RangeError);
            });

            it('scale', function() {
                var fn1 = function() {
                    stage.scale({});
                };
                var fn2 = function() {
                    stage.scale(-1);
                };
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.scale()).to.equal(stage.options.scale);
                expect(fn1).to.throw(TypeError);
                expect(fn2).to.throw(RangeError);
            });

            xit('properties', function() {

            });

        });


        describe('MVVM', function() {

            var element, stage, viewModel;

            /*
             //For obscure reasons, setting the viewModel here does not work
             viewModel = kendo.observable({
                components: new kidoju.PageComponentCollectionDataSource({ data: pageComponentCollectionData }),
                current: null
             });
             */

            beforeEach(function() {
                element = $(STAGE2).appendTo(FIXTURES);
                viewModel = kendo.observable({
                    components: new kidoju.PageComponentCollectionDataSource({ data: pageComponentCollectionData }),
                    current: null
                });
                kendo.bind(FIXTURES, viewModel);
                stage = element.data('kendoStage');
            });

            it('Adding a component to the viewModel adds the corresponding element to the stage', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length);
                viewModel.components.add(new kidoju.PageComponent({
                    id: kendo.guid(),
                    tool : 'label',
                    top: 250,
                    left: 500,
                    height: 100,
                    width: 300,
                    rotate: 90,
                    attributes: {
                        style: 'font-family: Georgia, serif; color: #FF0000;',
                        text: 'World'
                    }
                }));
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length + 1);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length + 1);
            });

            it('Removing a component from the viewModel removes the corresponding element from the stage', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length);
                viewModel.components.remove(viewModel.components.at(0));
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length - 1);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length - 1);
            });

            it('Changing the selected component in the viewModel changes the corresponding element in the stage', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length);
                var check = sinon.spy();
                $.each(viewModel.components.data(), function(index, component) {
                    check();
                    viewModel.set('current', component);
                    var handleBox = stage.wrapper.find('div.kj-handle-box');
                    expect(handleBox).to.be.an.instanceof($).with.property('length', 1);
                    expect(handleBox).to.have.attr(kendo.attr('uid'), component.uid);
                });
                expect(check).to.have.callCount(pageComponentCollectionData.length);
            });

            it('Changing the selected element in the stage, changes the corresponding component in the viewModel', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length);
                var check = sinon.spy();
                $.each(stage.items(), function(index, item) {
                    check();
                    $(item).simulate('mousedown', {bubbles: true});
                    var component = viewModel.get('current');
                    expect(component).to.have.property('uid', $(item).attr(kendo.attr('uid')));
                    var handleBox = stage.wrapper.find('div.kj-handle-box');
                    expect(handleBox).to.have.attr(kendo.attr('uid'), component.uid);
                    expect(handleBox).to.have.css('display', 'block');
                    expect(handleBox).to.have.css('top', component.top + 'px');
                    expect(handleBox).to.have.css('left', component.left + 'px');
                    expect(handleBox).to.have.css('height', component.height + 'px');
                    expect(handleBox).to.have.css('width', component.width + 'px');
                    //rotate?
                });
                expect(check).to.have.callCount(pageComponentCollectionData.length);
            });

            it('Adding a new element to the stage, adds the corresponding component to the viewModel', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length);
                var total = pageComponentCollectionData.length,
                    offset = element.offset(),
                    count = 0;
                var check = sinon.spy();
                $.each(Object.keys(kidoju.tools), function(index, key) {
                    var tool = kidoju.tools[key];
                    if (tool instanceof kidoju.Tool && tool.id !== kidoju.tools.pointer.id) {
                        check();
                        count++;
                        kidoju.tools.active = tool.id;
                        stage.element.simulate('mousedown', {
                            clientX: offset.left + 80 * count,
                            clientY: offset.top + 60 * count
                        });
                        expect(stage.dataSource.total()).to.equal(total + count);
                        expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', total + count);
                        var component = stage.dataSource.at(total + count - 1),
                            item = stage.items()[total + count - 1];
                        expect(component).to.have.property('id', '');
                        expect(component).to.have.property('tool', tool.id);
                        expect(component).to.have.property('top', 60 * count);
                        expect(component).to.have.property('left', 80 * count);
                        expect(component).to.have.property('height', tool.height);
                        expect(component).to.have.property('width', tool.width);
                        expect(component).to.have.property('rotate', 0);
                        expect($(item).attr(kendo.attr('uid'))).to.equal(component.uid);
                        expect($(item).attr(kendo.attr('tool'))).to.equal(component.tool);
                        expect($(item).css('position')).to.equal('absolute');
                        expect($(item).css('top')).to.equal(component.top + 'px');
                        expect($(item).css('left')).to.equal(component.left + 'px');
                        expect($(item).css('height')).to.equal(component.height + 'px');
                        expect($(item).css('width')).to.equal(component.width + 'px');
                        //TODO we would need a function to convert a 2D transform matrix into a rotation angle
                        //expect($(item).css('transform')).to.equal(kendo.format('rotate({0})deg', component.rotate));
                    }
                });
                expect(check).to.have.been.called;
            });

            it('Moving an element on stage, updates top & left properties of the corresponding component in the viewModel', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length);
                var check = sinon.spy();
                $.each(stage.items(), function(index, item) {
                    check();
                    $(item).simulate('mousedown', {bubbles: true}); //display handles
                    expect(viewModel.get('current')).to.have.property('uid', $(item).attr(kendo.attr('uid'))); //check selected item
                    //record coordinates before dragging
                    var top = viewModel.get('current.top'),
                        left = viewModel.get('current.left'),
                        height = viewModel.get('current.height'),
                        width = viewModel.get('current.width'),
                        rotate = viewModel.get('current.rotate'),
                        handle = stage.wrapper.find('span.kj-handle[data-command="move"]');
                    //check move handle and calculate center
                    expect(handle).to.be.an.instanceof($).with.property('length', 1);
                    var center = findCenter(handle), moves = 10, dx = 100, dy = 50,
                        x = center.x, y = center.y;
                    //initiate drag with mousedown event
                    handle.simulate('mousedown', { bubbles: true, clientX: x, clientY: y }); //initiate drag on move handle
                    //move item
                    for (var i = 0; i < moves; i++) {
                        x += dx / moves;
                        y += dy / moves;
                        $(item).simulate('mousemove', { bubbles: true, clientX: x, clientY: y });
                    }
                    //end drag with mouseup event
                    $(item).simulate('mouseup', { bubbles: true, clientX: x, clientY: y });
                    //check new coordinates
                    expect(viewModel.get('current.top')).to.equal(top + dy);
                    expect(viewModel.get('current.left')).to.equal(left + dx);
                    expect(viewModel.get('current.height')).to.equal(height);
                    expect(viewModel.get('current.width')).to.equal(width);
                    expect(viewModel.get('current.rotate')).to.equal(rotate);
                });
                expect(check).to.have.callCount(pageComponentCollectionData.length);
            });

            it('Rotating an element on stage, updates the rotate property of the corresponding component in the viewModel', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length);
                var check = sinon.spy();
                $.each(stage.items(), function(index, item) {
                    check();
                    $(item).simulate('mousedown', {bubbles: true}); //display handles
                    expect(viewModel.get('current')).to.have.property('uid', $(item).attr(kendo.attr('uid'))); //check selected item
                    //record coordinates before dragging
                    var top = viewModel.get('current.top'),
                        left = viewModel.get('current.left'),
                        height = viewModel.get('current.height'),
                        width = viewModel.get('current.width'),
                        rotate = viewModel.get('current.rotate'),
                        handle = stage.wrapper.find('span.kj-handle[data-command="rotate"]');
                    //check move handle and calculate center
                    expect(handle).to.be.an.instanceof($).with.property('length', 1);
                    var center = findCenter(handle), moves = 10, dx = 50, dy = 100,
                        x = center.x, y = center.y;
                    //initiate drag with mousedown event
                    handle.simulate('mousedown', {bubbles: true, clientX: x, clientY: y}); //initiate drag on move handle
                    //move item
                    for (var i = 0; i < moves; i++) {
                        x += dx / moves;
                        y += dy / moves;
                        $(item).simulate('mousemove', {bubbles: true, clientX: x, clientY: y});
                    }
                    //end drag with mouseup event
                    $(item).simulate('mouseup', {bubbles: true, clientX: x, clientY: y});
                    //check new coordinates
                    var c = findCenter($(item)), p1 = center, p2 = { x: x, y: y},
                        dr = (Math.atan2(p2.y - c.y, p2.x - c.x) - Math.atan2(p1.y - c.y, p1.x - c.x)) * 180 / Math.PI;
                    expect(viewModel.get('current.top')).to.equal(top);
                    expect(viewModel.get('current.left')).to.equal(left);
                    expect(viewModel.get('current.height')).to.equal(height);
                    expect(viewModel.get('current.width')).to.equal(width);
                    expect(viewModel.get('current.rotate')).not.to.equal(rotate);
                    //TODO: Better to recalculate the correct value instead of simply assessing change
                    //expect(viewModel.get('current.rotate')).to.equal((360 + rotate + dr) % 360);
                });
                expect(check).to.have.callCount(pageComponentCollectionData.length);
            });


            it('Resizing an element on stage, updates the top, left, height & width properties of the corresponding component in the viewModel', function() {
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.total()).to.equal(pageComponentCollectionData.length);
                expect(stage.items()).to.be.an.instanceof(window.HTMLCollection).with.property('length', pageComponentCollectionData.length);
                var check = sinon.spy();
                $.each(stage.items(), function(index, item) {
                    check();
                    $(item).simulate('mousedown', {bubbles: true}); //display handles
                    expect(viewModel.get('current')).to.have.property('uid', $(item).attr(kendo.attr('uid'))); //check selected item
                    //record coordinates before dragging
                    var top = viewModel.get('current.top'),
                        left = viewModel.get('current.left'),
                        height = viewModel.get('current.height'),
                        width = viewModel.get('current.width'),
                        rotate = viewModel.get('current.rotate'),
                        handle = stage.wrapper.find('span.kj-handle[data-command="resize"]');
                    //check move handle and calculate center
                    expect(handle).to.be.an.instanceof($).with.property('length', 1);
                    var center = findCenter(handle), moves = 10, dx = 80, dy = 120,
                        x = center.x, y = center.y;
                    //initiate drag with mousedown event
                    handle.simulate('mousedown', {bubbles: true, clientX: x, clientY: y}); //initiate drag on resize handle
                    //resize item
                    for (var i = 0; i < moves; i++) {
                        x += dx / moves;
                        y += dy / moves;
                        $(item).simulate('mousemove', {bubbles: true, clientX: x, clientY: y});
                    }
                    //end drag with mouseup event
                    $(item).simulate('mouseup', {bubbles: true, clientX: x, clientY: y});
                    //check new coordinates
                    if (rotate) {
                        expect(viewModel.get('current.top')).not.to.equal(top);
                        expect(viewModel.get('current.left')).not.to.equal(left);
                    } else {
                        expect(viewModel.get('current.top')).to.equal(top);
                        expect(viewModel.get('current.left')).to.equal(left);
                    }
                    expect(viewModel.get('current.height')).not.to.equal(height);
                    expect(viewModel.get('current.width')).not.to.equal(width);
                    expect(viewModel.get('current.rotate')).to.equal(rotate);
                });
                expect(check).to.have.callCount(pageComponentCollectionData.length);
            });
        });

        describe('Events', function() {

            var element, stage;

            beforeEach(function() {
                element = $(STAGE1).appendTo(FIXTURES);
            });

            it('dataBinding & dataBound', function() {
                var dataBinding = sinon.spy(),
                    dataBound = sinon.spy();
                stage = element.kendoStage({
                    dataSource: pageComponentCollectionData,
                    dataBinding: function(e) {
                        dataBinding(e.sender);
                    },
                    dataBound: function(e) {
                        dataBound(e.sender);
                    }
                }).data('kendoStage');
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(dataBinding).to.have.been.calledOnce;
                expect(dataBinding).to.have.been.calledWith(stage);
                expect(dataBound).to.have.been.calledOnce;
                expect(dataBound).to.have.been.calledWith(stage);
                expect(dataBinding).to.have.been.calledBefore(dataBound);
            });

            it('propBinding & propBound', function() {
                var propBinding = sinon.spy(),
                    propBound = sinon.spy();
                stage = element.kendoStage({
                    mode: kendo.ui.Stage.fn.modes.play,   //TODO only in play mode
                    dataSource: pageComponentCollectionData,
                    propBinding: function(e) {
                        propBinding(e.sender);
                    },
                    propBound: function(e) {
                        propBound(e.sender);
                    }
                }).data('kendoStage');
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(propBinding).to.have.been.calledOnce;
                expect(propBinding).to.have.been.calledWith(stage);
                expect(propBound).to.have.been.calledOnce;
                expect(propBound).to.have.been.calledWith(stage);
                expect(propBinding).to.have.been.calledBefore(propBound);
            });

            it('change', function() {
                var change = sinon.spy();
                stage = element.kendoStage({
                    dataSource: pageComponentCollectionData,
                    change: function(e) {
                        change(e.value);
                    }
                }).data('kendoStage');
                expect(stage).to.be.an.instanceof(kendo.ui.Stage);
                expect(stage.dataSource).to.be.an.instanceof(kidoju.PageComponentCollectionDataSource);
                expect(stage.dataSource.data()).to.be.an.instanceof(kendo.data.ObservableArray).with.property('length', pageComponentCollectionData.length);
                var component = stage.dataSource.at(1);
                expect(component).to.be.an.instanceof(kidoju.PageComponent);
                stage.value(component);
                expect(change).to.have.been.calledOnce;
                expect(change).to.have.been.calledWith(component);
            });

            //TODO: select event

        });

        afterEach(function() {
            var fixtures = $(FIXTURES);
            kendo.destroy(fixtures);
            fixtures.find('*').off();
            fixtures.empty();
        });

    });

}(this, jQuery));
