/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* eslint-disable no-unused-expressions */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'kendo.data';
import chai from 'chai';
import JSC from 'jscheck';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { assertBaseModel, tryCatch } from '../_misc/test.util.es6';
import {
    getComponentArray,
    getPage
} from '../_misc/test.components.es6';
import { getErrorTransport } from '../_misc/test.transports.es6';
import CONSTANTS from '../../../src/js/common/window.constants.es6';
import PageComponentDataSource from '../../../src/js/data/datasources.pagecomponent.es6';
import Page from '../../../src/js/data/models.page.es6';
import Stream from '../../../src/js/data/models.stream.es6';
import '../../../src/js/app/app.tools.es6';

const { describe, it, xit } = window;
const {
    data: { DataSource }
} = window.kendo;
const { expect } = chai;
chai.use(sinonChai);

describe('models.page', () => {
    describe('Page', () => {
        describe('Initialization', () => {
            it('It should initialize without options', done => {
                // Unfortunately, this is a Kendo UI requirement
                const page = new Page();
                const { components } = page;
                expect(components).to.be.an.instanceof(PageComponentDataSource);
                expect(page).to.have.property('id').that.is.null;
                expect(page).to.have.property('explanations', '');
                expect(page).to.have.property('instructions', '');
                expect(page).to.have.property('style', '');
                expect(page).to.have.property('time', 30);
                components
                    .fetch()
                    .then(
                        tryCatch(done)(() => {
                            expect(components.total()).to.equal(0);
                        })
                    )
                    .catch(done);
            });

            it('It should throw when initializing with invalid components', () => {
                const options = {
                    components: [JSC.object()()]
                };
                const page = new Page(options);
                const { components } = page;
                expect(components).to.be.an.instanceof(PageComponentDataSource);
                expect(page).to.have.property('id').that.is.null;
                expect(page).to.have.property('explanations', '');
                expect(page).to.have.property('instructions', '');
                expect(page).to.have.property('style', '');
                expect(page).to.have.property('time', 30);
                expect(components.fetch).to.throw;
                expect(components.read).to.throw;
                expect(page.load).to.throw;
            });

            it('It should initialize from a dummy object', done => {
                const options = JSC.object()();
                const prop = Object.keys(options)[0];
                const page = new Page(options);
                const { components } = page;
                expect(components).to.be.an.instanceof(PageComponentDataSource);
                expect(page).to.have.property('id').that.is.null;
                expect(page).to.have.property('explanations', '');
                expect(page).to.have.property('instructions', '');
                expect(page).to.have.property('style', '');
                expect(page).to.have.property('time', 30);
                expect(page[prop]).to.be.undefined;
                components
                    .fetch()
                    .then(
                        tryCatch(done)(() => {
                            expect(components.total()).to.equal(0);
                        })
                    )
                    .catch(done);
            });

            it('if should initialize with bare components', done => {
                const data = getComponentArray();
                const options = {
                    components: data.map(item => ({
                        tool: item.tool
                    }))
                };
                const page = new Page(options);
                const { components } = page;
                expect(components).to.be.an.instanceof(PageComponentDataSource);
                expect(page).to.have.property('id').that.is.null;
                expect(page).to.have.property('explanations', '');
                expect(page).to.have.property('instructions', '');
                expect(page).to.have.property('style', '');
                expect(page).to.have.property('time', 30);
                expect(components).to.respondTo('fetch');
                components
                    .fetch()
                    .then(
                        tryCatch(done)(() => {
                            expect(components.total()).to.equal(data.length);
                            components.data().forEach((component, index) => {
                                assertBaseModel(
                                    component,
                                    Object.assign(
                                        {},
                                        component.defaults,
                                        {
                                            attributes:
                                                component.attributes.defaults,
                                            properties:
                                                component.properties.defaults
                                        },
                                        options.components[index]
                                    )
                                );
                            });
                        })
                    )
                    .catch(done);
            });

            it('if should initialize with all data', done => {
                const options = getPage();
                const page = new Page(options);
                const { components } = page;
                expect(components).to.be.an.instanceof(PageComponentDataSource);
                expect(page).to.have.property('id');
                expect(page).to.have.property('explanations');
                expect(page).to.have.property('instructions');
                expect(page).to.have.property('style');
                expect(page).to.have.property('time');
                expect(components).to.respondTo('fetch');
                components
                    .fetch()
                    .then(
                        tryCatch(done)(() => {
                            expect(components.total()).to.equal(
                                options.components.length
                            );
                            components.data().forEach((component, index) => {
                                assertBaseModel(
                                    component,
                                    options.components[index]
                                );
                            });
                        })
                    )
                    .catch(done);
            });
        });

        describe('Non-editable fields', () => {
            it('It should not modify id', () => {
                const options = getPage();
                const page = new Page(options);
                expect(page.fields[page.idField].editable).to.be.false;
                page.set(page.idField, JSC.string()());
                // Modification is simply discarded (no error is thrown)
                expect(page).to.have.property(page.idField, options.id);
            });
        });

        /*
        describe('append', () => {
            it('...', () => {});
        });

        describe('load', () => {
            it('...', () => {});
        });

        describe('loaded', () => {
            it('...', () => {});
        });
        */

        describe('assets', () => {
            it('It should list assets', done => {
                const options = getPage();
                const page = new Page(options);
                page.load()
                    .then(
                        tryCatch(done)(() => {
                            const assets = page.assets();
                            expect(assets)
                                .to.have.property('audio')
                                .that.is.an('array');
                            expect(assets)
                                .to.have.property('image')
                                .that.is.an('array');
                            expect(assets)
                                .to.have.property('video')
                                .that.is.an('array');
                            // TODO: how do we ensure these have the correct list?
                        })
                    )
                    .catch(done);
            });
        });

        xdescribe('pages.components.parent', () => {
            xit('TODO', () => {
                expect(true).to.be.false;
            });
        });

        describe('stream', () => {
            it('it should return the parent stream', () => {
                expect(true).to.be.false;
            });
        });

        xdescribe('index', () => {
            xit('TODO', () => {
                expect(true).to.be.false;
            });
        });

        xdescribe('clone', () => {
            it('It should clone any page', done => {
                const options = getPage();
                const page = new Page(options);
                const { components } = page;
                expect(components).to.be.an.instanceof(PageComponentDataSource);
                components
                    .fetch()
                    .then(
                        tryCatch(done)(() => {
                            assertBaseModel(page, options);
                            const clone = page.clone();
                            // Clean options
                            options.id = null;
                            options.components.forEach((component, index) => {
                                /* eslint-disable no-param-reassign */
                                const model = clone.components.at(index);
                                component[model.idField] =
                                    model.defaults[model.idField];
                                if (model.properties.defaults.name) {
                                    component.properties.failure =
                                        model.properties.defaults.failure;
                                    component.properties.name =
                                        model.properties.defaults.name;
                                    component.properties.omit =
                                        model.properties.defaults.omit;
                                    component.properties.question =
                                        model.properties.defaults.question;
                                    component.properties.solution =
                                        model.properties.defaults.solution;
                                    component.properties.success =
                                        model.properties.defaults.success;
                                    component.properties.omit =
                                        model.properties.defaults.omit;
                                }
                                /* eslint-enable no-param-reassign */
                            });
                            assertBaseModel(clone, options);
                        })
                    )
                    .catch(done);
            });
        });

        xdescribe('Validation', () => {
            xit('TODO', () => {
                expect(true).to.be.false;
            });
        });

        xdescribe('toJSON', () => {
            it('It should save to JSON', () => {
                expect(true).to.be.false;
                // TODO: test default values are undefined
            });
        });

        describe('Events', () => {
            it('It should propagate CHANGE events when updating components', done => {
                const options = getPage();
                const page = new Page(options);
                const { components } = page;
                const pageChange = sinon.spy();
                const componentsChange = sinon.spy();
                page.bind(CONSTANTS.CHANGE, e => {
                    debugger;
                    pageChange(e);
                });
                components.bind(CONSTANTS.CHANGE, e => {
                    debugger;
                    componentsChange(e);
                });
                debugger;
                components
                    .fetch()
                    .then(
                        tryCatch(done)(() => {
                            debugger;
                            let hasLabel = false;
                            components.data().forEach(component => {
                                if (component.get('tool') === 'label') {
                                    component.attributes.set(
                                        'text',
                                        JSC.string()()
                                    );
                                    hasLabel = true;
                                }
                            });
                            if (hasLabel) {
                                // Called once when fetch
                                // Called twice when attributes.set
                                expect(pageChange).to.have.been.calledTwice;
                                expect(componentsChange).to.have.been
                                    .calledTwice;
                            } else {
                                // Called once when fetch
                                expect(pageChange).to.have.been.calledOnce;
                                expect(componentsChange).to.have.been
                                    .calledOnce;
                            }
                        })
                    )
                    .catch(done);
            });

            xit('It should propagate CHANGE events when adding/inserting components', done => {
                const options = getPage();
                const page = new Page(options);
                const { components } = page;
                const pageChange = sinon.spy();
                const componentsChange = sinon.spy();
                page.bind(CONSTANTS.CHANGE, e => {
                    // debugger;
                    pageChange(e);
                });
                components.bind(CONSTANTS.CHANGE, e => {
                    // debugger;
                    componentsChange(e);
                });
                components
                    .fetch()
                    .then(
                        tryCatch(done)(() => {
                            const component = getComponentArray()[0];
                            components.add(component);
                            // Called once when fetch
                            // Called twice when attributes.set
                            expect(pageChange).to.have.been.calledTwice;
                            expect(componentsChange).to.have.been.calledTwice;
                        })
                    )
                    .catch(done);
            });

            xit('It should propagate ERROR events from data source to page', () => {
                const PageWithModel = Page.define({
                    model: {
                        components: {
                            transport: getErrorTransport()
                        }
                    }
                });
                const options = getPage();
                const page = new PageWithModel(options);
                const { components } = page;
                const pageError = sinon.spy();
                const componentsError = sinon.spy();
                page.bind(CONSTANTS.ERROR, e => {
                    // debugger;
                    pageError(e);
                });
                components.bind(CONSTANTS.ERROR, e => {
                    // debugger;
                    componentsError(e);
                });
                page.components.fetch();
                expect(pageError).to.have.been.calledOnce;
                expect(componentsError).to.have.been.calledOnce;
            });
        });
    });

    describe('Page.createTextBoxPage', () => {
        xit('TODO', () => {
            expect(true).to.be.false;
        });
    });

    describe('Page.createQuizPage', () => {
        xit('TODO', () => {
            expect(true).to.be.false;
        });
    });

    describe('Page.createMultiQuizPage', () => {
        xit('TODO', () => {
            expect(true).to.be.false;
        });
    });
});
