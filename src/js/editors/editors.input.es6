/**
 * Copyright (c) 2013-2018 Memba Sarl. All rights reserved.
 * Sources at https://github.com/Memba
 */

// https://github.com/benmosher/eslint-plugin-import/issues/1097
// eslint-disable-next-line import/extensions, import/no-unresolved
import $ from 'jquery';
import 'kendo.core';
import assert from '../common/window.assert.es6';
import CONSTANTS from '../common/window.constants.es6';
import { getValueBinding } from '../data/data.util.es6';

const { attr } = window.kendo;

/**
 * Input
 * @param container
 * @param options
 */
function input(container, options) {
    assert.isPlainObject(
        options,
        assert.format(assert.messages.isPlainObject.default, 'options')
    );
    assert.type(
        CONSTANTS.STRING,
        options.field,
        assert.format(
            assert.messages.type.default,
            'options.field',
            CONSTANTS.STRING
        )
    );
    const { attributes } = options;
    if (
        attributes &&
        $.type(attributes[attr('role')]) === CONSTANTS.UNDEFINED
    ) {
        if (
            [undefined, 'text', 'email', 'search', 'tel', 'url'].indexOf(
                attributes.type
            ) > -1
        ) {
            attributes.class =
                $.type(attributes.class) === CONSTANTS.STRING
                    ? attributes.class
                    : 'k-textbox';
        } else if (['button', 'reset'].indexOf(attributes.type) > -1) {
            attributes.class =
                $.type(attributes.class) === CONSTANTS.STRING
                    ? attributes.class
                    : 'k-button';
        }
    }
    $('<input style="width: 100%;"/>')
        .attr('name', options.field)
        .attr($.extend({}, attributes, getValueBinding(options.field)))
        .appendTo(container);
}

/**
 * Default export
 */
export default input;