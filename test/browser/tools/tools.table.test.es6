/**
 * Copyright (c) 2013-2019 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* eslint-disable no-unused-expressions */

// Load i18n resources
import '../../../src/js/cultures/all.en.es6';

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'kendo.core';
import chai from 'chai';
import CONSTANTS from '../../../src/js/common/window.constants.es6';
import { PageComponent } from '../../../src/js/data/data.pagecomponent';
import tools from '../../../src/js/tools/tools.es6';
import { BaseTool } from '../../../src/js/tools/tools.base.es6';
import TOOLS from '../../../src/js/tools/util.constants.es6';

// Component data
import { getTable } from '../_misc/test.components';

const { describe, it, kendo, xit } = window;
const { expect } = chai;

describe('tools.table', () => {
    before(done => {
        if (window.__karma__ && $(`#${FIXTURES}`).length === 0) {
            $(CONSTANTS.BODY).append(`<div id="${FIXTURES}"></div>`);
        }
        // load tool
        tools.load(TOOL).always(done);
    });

    describe('TabkeTool', () => {
        let tool;
        let component;

        before(() => {
            tool = tools(TOOL);
            component = new PageComponent(getTable());
        });

        it('It should have descriptors', () => {
            expect(tool).to.be.an.instanceof(BaseTool);
            expect(tool).to.have.property('cursor', CONSTANTS.DEFAULT_CURSOR);
            expect(tool).to.have.property('description', 'Pointer');
            expect(tool).to.have.property('height', '0');
            expect(tool).to.have.property('id', 'pointer');
            expect(tool).to.have.property('icon', 'mouse_pointer');
            expect(tool).to.have.property('weight', '0');
            expect(tool).to.have.property('width', '0');
        });

        it('It should have attributes', () => {
            expect(tool.attributes).to.deep.equal({});
        });

        it('It should have properties', () => {
            expect(tool.properties).to.deep.equal({});
        });

        it('getHtmlContent', () => {
            expect(tool.getHtmlContent).to.be.undefined;
        });

        it('onResize', () => {
            expect(tool.onResize).to.be.undefined;
        });
    });
});


