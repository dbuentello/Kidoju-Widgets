/**
 * Copyright (c) 2013-2019 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

// TODO help and menu

/* eslint-disable no-unused-expressions */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import chai from 'chai';
import chaiJquery from 'chai-jquery';
import CONSTANTS from '../../../src/js/common/window.constants.es6';
import BaseModel from '../../../src/js/data/data.base.es6';
import PageComponent from '../../../src/js/data/models.pagecomponent.es6';
import tools from '../../../src/js/tools/tools.es6';
import BaseTool from '../../../src/js/tools/tools.base.es6';

// Load tool
import '../../../src/js/tools/tools.label.es6';
// Load component
import { getLabel } from '../_misc/test.components.es6';

const { describe, it } = window;
const { expect } = chai;

chai.use((c, u) => chaiJquery(c, u, $));
const FIXTURES = '#fixtures';

describe('tools.label', () => {
    before(() => {
        if (window.__karma__ && $(FIXTURES).length === 0) {
            $(CONSTANTS.BODY).append('<div id="fixtures"></div>');
        }
    });

    describe('LabelTool', () => {
        const tool = tools.label;
        const component = new PageComponent(getLabel());

        it('It should have descriptors', () => {
            expect(tool).to.be.an.instanceof(BaseTool);
            expect(tool).to.have.property('cursor', CONSTANTS.CROSSHAIR_CURSOR);
            expect(tool).to.have.property('description', 'Label');
            expect(tool).to.have.property('height', 80);
            expect(tool).to.have.property('help', null); // TODO
            expect(tool).to.have.property('id', 'label');
            expect(tool).to.have.property('icon', 'font');
            // TODO expect(tool).to.have.property('menu', 'Label');
            expect(tool).to.have.property('name', 'Label');
            expect(tool).to.have.property('weight', 0);
            expect(tool).to.have.property('width', 300);
        });

        it('getAttributeModel', () => {
            const Model = tool.getAttributeModel(component);
            expect(
                Object.prototype.isPrototypeOf.call(
                    BaseModel.prototype,
                    Model.prototype
                )
            ).to.be.true;
            expect(Model.fields).to.have.property('text');
            expect(Model.fields).to.have.property('style');
        });

        it('getAttributeRows', () => {
            const rows = tool.getAttributeRows(component);
            expect(rows)
                .to.be.an('array')
                .with.lengthOf(7);
            expect(rows[0]).to.have.property('field', 'top');
            expect(rows[1]).to.have.property('field', 'left');
            expect(rows[2]).to.have.property('field', 'height');
            expect(rows[3]).to.have.property('field', 'width');
            expect(rows[4]).to.have.property('field', 'rotate');
            expect(rows[5]).to.have.property('field', 'attributes.text');
            expect(rows[6]).to.have.property('field', 'attributes.style');
        });

        it('getPropertyModel', () => {
            const Model = tool.getPropertyModel(component);
            expect(
                Object.prototype.isPrototypeOf.call(
                    BaseModel.prototype,
                    Model.prototype
                )
            ).to.be.true;
            expect(Model.fields).to.have.property('behavior');
            expect(Model.fields).to.have.property('constant');
        });

        it('getPropertyRows', () => {
            const rows = tool.getPropertyRows(component);
            expect(rows)
                .to.be.an('array')
                .with.lengthOf(2);
            expect(rows[0]).to.have.property('field', 'properties.behavior');
            expect(rows[1]).to.have.property('field', 'properties.constant');
        });

        it('getAssets', () => {
            const assets = tool.getAssets(component);
            expect(assets)
                .to.have.property('audio')
                .that.is.an('array')
                .with.lengthOf(0);
            expect(assets)
                .to.have.property('image')
                .that.is.an('array')
                .with.lengthOf(0);
            expect(assets)
                .to.have.property('video')
                .that.is.an('array')
                .with.lengthOf(0);
        });

        it('getDescription', () => {
            expect(Object.prototype.hasOwnProperty.call(tool, 'getDescription'))
                .to.be.false;
            expect(tool).to.respondTo('getDescription');
        });

        it('getHelp', () => {
            expect(Object.prototype.hasOwnProperty.call(tool, 'getHelp')).to.be
                .false;
            expect(tool).to.respondTo('getHelp');
        });

        it('getTestModelField', () => {
            expect(
                Object.prototype.hasOwnProperty.call(tool, 'getTestModelField')
            ).to.be.false;
            expect(tool).to.respondTo('getTestModelField');
        });

        it('getHtmlContent', () => {
            // If we do not submit a page component
            function fn1() {
                return tool.getHtmlContent({});
            }
            expect(fn1).to.throw;

            // If we do not submit a mode
            function fn2() {
                return tool.getHtmlContent(component);
            }
            expect(fn2).to.throw;

            // Test all stage CONSTANTS.STAGE_MODES
            Object.values(CONSTANTS.STAGE_MODES).forEach(mode => {
                const html = tool.getHtmlContent(component, mode);
                expect(html).to.match(/^<div/);
            });
        });

        it('getHtmlCheckMarks', () => {
            expect(
                Object.prototype.hasOwnProperty.call(tool, 'getHtmlCheckMarks')
            ).to.be.false;
            expect(tool).to.respondTo('getHtmlCheckMarks');
        });

        it('getHtmlValue', () => {
            expect(Object.prototype.hasOwnProperty.call(tool, 'getHtmlValue'))
                .to.be.false;
            expect(tool).to.respondTo('getHtmlValue');
        });

        it('getHtmlSolution', () => {
            expect(
                Object.prototype.hasOwnProperty.call(tool, 'getHtmlSolution')
            ).to.be.false;
            expect(tool).to.respondTo('getHtmlSolution');
        });

        xit('onEnable', () => {
            expect(tool).to.respondTo('onEnable');
        });

        xit('onResize', () => {
            expect(tool).to.respondTo('onResize');
        });

        xit('validate', () => {
            expect(tool).to.respondTo('validate');
        });
    });
});
