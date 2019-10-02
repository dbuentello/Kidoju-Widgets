/**
 * Copyright (c) 2013-2019 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

/* eslint-disable no-unused-expressions */

import chai from 'chai';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'modernizr';
import CONSTANTS from '../../../src/js/common/window.constants.es6';
import {
    enumerateDevices,
    getUserMedia,
    createAudioMeter
} from '../../../src/js/common/window.media.es6';

const {
    AudioContext,
    describe,
    it,
    MediaDeviceInfo,
    MediaStream,
    Modernizr,
    navigator: { userAgent },
    ScriptProcessorNode
} = window;
const { expect } = chai;

if (!Modernizr.getusermedia || userAgent.indexOf('HeadlessChrome') > -1) {
    // getUserMedia does not work with headless chrome
    // https://github.com/Modernizr/Modernizr/issues/2375
    document.getElementById('mocha').innerHTML =
        '<span>getUserMedia is not supported</span>';
    // return; // Cannot have a return statement here (check in IE)
} else {
    describe('window.media', () => {
        describe('enumerateDevices', () => {
            it('It should enumerate devices', done => {
                enumerateDevices()
                    .then(devices => {
                        try {
                            expect(devices)
                                .to.be.an(CONSTANTS.ARRAY)
                                .with.property('length')
                                .gt(0);
                            for (
                                let i = 0, { length } = devices;
                                i < length;
                                i++
                            ) {
                                expect(devices[i]).to.be.an.instanceof(
                                    MediaDeviceInfo
                                );
                            }
                            done();
                        } catch (ex) {
                            done(ex);
                        }
                    })
                    .catch(done);
            });
        });

        describe('getUserMedia', () => {
            it('It should get user media', done => {
                getUserMedia()
                    .then(stream => {
                        try {
                            expect(stream).to.be.an.instanceof(MediaStream);
                            done();
                        } catch (ex) {
                            done(ex);
                        }
                    })
                    .catch(done);
            });
        });

        describe('createAudioMeter', () => {
            it('It should create an audio meter', () => {
                const context = new AudioContext();
                const processor = createAudioMeter(context);
                expect(processor).to.be.an.instanceof(ScriptProcessorNode);
            });
        });
    });
}
