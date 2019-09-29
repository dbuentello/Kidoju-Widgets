/**
 * Copyright (c) 2013-2019 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* eslint-disable no-unused-expressions */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'jquery.simulate';
import 'kendo.binder';
import chai from 'chai';
import chaiJquery from 'chai-jquery';
import JSC from 'jscheck';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import CONSTANTS from '../../../src/js/common/window.constants.es6';
import '../../../src/js/widgets/widgets.license.es6';

const { afterEach, before, beforeEach, describe, it } = window;
const { expect } = chai;
const {
    attr,
    bind,
    destroy,
    init,
    observable,
    ui: { License, roles }
} = window.kendo;
const FIXTURES = 'fixtures';
const ELEMENT = `<${CONSTANTS.DIV}>`;
const ROLE = 'license';
const CLASS = 'kendoLicense';

function getValue() {
    return JSC.one_of([0, 1, 13])();
}

function assertIcons(element, value) {
    switch (value) {
        case 0:
            expect(element.find('a > i')).to.have.lengthOf(1);
            break;
        case 1:
            expect(element.find('a > i')).to.have.lengthOf(2);
            break;
        case 13:
        default:
            expect(element.find('a > i')).to.have.lengthOf(4);
    }
}

chai.use((c, u) => chaiJquery(c, u, $));
chai.use(sinonChai);

describe('widgets.license', () => {
    before(() => {
        if (window.__karma__ && $(`#${FIXTURES}`).length === 0) {
            $(CONSTANTS.BODY).append(`<div id="${FIXTURES}"></div>`);
        }
    });

    describe('Availability', () => {
        it('requirements', () => {
            expect($).not.to.be.undefined;
            expect(window.kendo).not.to.be.undefined;
            expect($.fn[CLASS]).to.be.a(CONSTANTS.FUNCTION);
            expect(roles[ROLE]).to.be.a(CONSTANTS.FUNCTION);
        });
    });

    describe('Initialization', () => {
        it('from code', () => {
            const element = $(ELEMENT).appendTo(`#${FIXTURES}`);
            const widget = element[CLASS]().data(CLASS);
            expect(widget).to.be.an.instanceof(License);
            expect(element).not.to.have.class('k-widget');
            expect(element).to.have.class(`kj-${ROLE}`);
            assertIcons(element, widget.value());
        });

        it('from code with options', () => {
            const element = $(ELEMENT).appendTo(`#${FIXTURES}`);
            const options = {
                value: getValue()
            };
            const widget = element[CLASS](options).data(CLASS);
            expect(widget).to.be.an.instanceof(License);
            expect(element).not.to.have.class('k-widget');
            expect(element).to.have.class(`kj-${ROLE}`);
            assertIcons(element, options.value);
        });

        it('from markup', () => {
            const attributes = {};
            attributes[attr('role')] = ROLE;
            const element = $(ELEMENT)
                .attr(attributes)
                .appendTo(`#${FIXTURES}`);
            init(`#${FIXTURES}`);
            const widget = element.data(CLASS);
            expect(widget).to.be.an.instanceof(License);
            expect(element).not.to.have.class('k-widget');
            expect(element).to.have.class(`kj-${ROLE}`);
            assertIcons(element, widget.value());
        });

        it('from markup with attributes', () => {
            const attributes = {
                'data-value': getValue()
            };
            attributes[attr('role')] = ROLE;
            const element = $(ELEMENT)
                .attr(attributes)
                .appendTo(`#${FIXTURES}`);
            init(`#${FIXTURES}`);
            const widget = element.data(CLASS);
            expect(widget).to.be.an.instanceof(License);
            expect(element).not.to.have.class('k-widget');
            expect(element).to.have.class(`kj-${ROLE}`);
            assertIcons(element, attributes['data-value']);
        });
    });

    describe('Methods', () => {
        let options;
        let element;
        let widget;

        beforeEach(() => {
            element = $(ELEMENT).appendTo(`#${FIXTURES}`);
            options = { value: getValue() };
            widget = element[CLASS](options).data(CLASS);
        });

        it('value (get)', () => {
            expect(widget).to.be.an.instanceof(License);
            expect(widget.value()).to.equal(options.value);
        });

        it('value (set)', () => {
            const value = getValue();
            expect(widget).to.be.an.instanceof(License);
            widget.value(value);
            expect(widget.value()).to.equal(value);
        });

        it('value (error)', () => {
            const fn1 = function() {
                widget.value(JSC.string()());
            };
            const fn2 = function() {
                widget.value(JSC.integer(100)());
            };
            expect(widget).to.be.an.instanceof(License);
            expect(fn1).to.throw(TypeError);
            expect(fn2).to.throw(RangeError);
        });

        it('enable/readonly', () => {
            expect(widget).to.be.an.instanceof(License);
            const { wrapper } = widget;
            expect(wrapper)
                .to.be.an.instanceof($)
                .with.property('length', 1);
            widget.enable(false);
            expect(wrapper).to.have.class(CONSTANTS.DISABLED_CLASS);
            widget.enable(true);
            expect(wrapper).not.to.have.class(CONSTANTS.DISABLED_CLASS);
        });

        // it('visible', function () {
        //     expect(widget).to.be.an.instanceof(License);
        //     expect(widget.wrapper).to.be.an.instanceof($).with.property('length', 1);
        //     TODO
        // });

        // it('destroy', function () {
        // TODO
        // });
    });

    describe('MVVM', () => {
        let element;
        let viewModel;
        let widget;

        beforeEach(() => {
            element = $(ELEMENT)
                .attr(attr('role'), ROLE)
                .attr(attr('bind'), 'value: license')
                .appendTo(`#${FIXTURES}`);
            viewModel = observable({
                license: getValue()
            });
            bind(`#${FIXTURES}`, viewModel);
            widget = element.data(CLASS);
        });

        it('Changing the value in the viewModel changes the license icon', () => {
            expect(widget).to.be.an.instanceof(License);
            assertIcons(element, viewModel.get('license'));
            viewModel.set('license', getValue());
            assertIcons(element, viewModel.get('license'));
        });
    });

    xdescribe('UI Interactions', () => {
        let element;
        let widget;

        beforeEach(() => {
            element = $(ELEMENT).appendTo(`#${FIXTURES}`);
            widget = element[CLASS]().data(CLASS);
        });

        it('mouseover', () => {});
    });

    xdescribe('Events', () => {
        let element;
        let widget;

        beforeEach(() => {
            element = $(ELEMENT).appendTo(`#${FIXTURES}`);
        });

        it('change', () => {
            const change = sinon.spy();
            widget = element[CLASS]({
                change(e) {
                    change(e.value);
                }
            }).data(CLASS);
            expect(widget).to.be.an.instanceof(License);
        });
    });

    afterEach(() => {
        const fixtures = $(`#${FIXTURES}`);
        destroy(fixtures);
        fixtures.find('*').off();
        fixtures.empty();
    });
});
