/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import path from 'path';
import {
  cleanup,
  createEmptyPackage,
  linkJestPackage,
  writeFiles,
} from '../Utils';
import runJest from '../runJest';
import os from 'os';
import mkdirp from 'mkdirp';
import fs from 'fs';
import {skipSuiteOnWindows} from '../../scripts/ConditionalTest';

skipSuiteOnWindows();

// doing test in a temp directory because we don't want jest node_modules affect it
const tempDir = path.resolve(os.tmpdir(), 'clashing-dependencies-test');
const thirdPartyDir = path.resolve(tempDir, 'third-party');

beforeEach(() => {
  cleanup(tempDir);
  createEmptyPackage(tempDir);
  mkdirp(path.join(thirdPartyDir, 'node_modules'));
  linkJestPackage('babel-jest', thirdPartyDir);
});

// This test case is checking that when having both
// `invariant` package from npm and `invariant.js` that provides `invariant`
// module we can still require the right invariant. This is pretty specific
// use case and in the future we should probably delete this test.
// see: https://github.com/facebook/jest/pull/6687
test('fails with syntax error on flow types', () => {
  const babelFileThatRequiresInvariant = require.resolve(
    'babel-traverse/lib/path/index.js',
  );

  expect(fs.existsSync(babelFileThatRequiresInvariant)).toBe(true);
  // make sure the babel depenency that depends on `invariant` from npm still
  // exists, otherwise the test will pass regardless of whether the bug still
  // exists or no.
  expect(fs.readFileSync(babelFileThatRequiresInvariant).toString()).toMatch(
    /invariant/,
  );
  writeFiles(tempDir, {
    '.babelrc': `
      {
        "plugins": [
          "${require.resolve('babel-plugin-transform-flow-strip-types')}"
        ]
      }
    `,
    '__tests__/test.js': `
      const invariant = require('../invariant');
      test('haii', () => expect(invariant(false, 'haii')).toBe('haii'));
    `,
    'invariant.js': `/**
      * @flow
      */
      const invariant = (condition: boolean, message: string) => message;
      module.exports = invariant;
    `,
    'jest.config.js': `module.exports = {
      transform: {'.*\\.js': './third-party/node_modules/babel-jest'},
    };`,
  });
  const {stderr, status} = runJest(tempDir, ['--no-cache', '--no-watchman']);
  // make sure there are no errors that lead to invariant.js (if we were to
  // require a wrong `invariant.js` we'd have a syntax error, because jest
  // internals wouldn't be able to parse flow annotations)
  expect(stderr).not.toMatch('invariant');
  expect(stderr).toMatch('PASS');
  expect(status).toBe(0);
});
