/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Argv} from 'types/Argv';
import type {
  GlobalConfig,
  InitialOptions,
  Path,
  ProjectConfig,
} from 'types/Config';

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {isJSONString, replaceRootDirInPath} from './utils';
import normalize from './normalize';
import resolveConfigPath from './resolveConfigPath';
import readConfigFileAndSetRootDir from './readConfigFileAndSetRootDir';

export {getTestEnvironment, isJSONString} from './utils';
export {default as normalize} from './normalize';
export {default as deprecationEntries} from './Deprecated';
export {replaceRootDirInPath} from './utils';
export {default as defaults} from './Defaults';
export {default as descriptions} from './Descriptions';

export function readConfig(
  argv: Argv,
  packageRootOrConfig: Path | InitialOptions,
  // Whether it needs to look into `--config` arg passed to CLI.
  // It only used to read initial config. If the initial config contains
  // `project` property, we don't want to read `--config` value and rather
  // read individual configs for every project.
  skipArgvConfigOption?: boolean,
  parentConfigPath: ?Path,
): {
  configPath: ?Path,
  globalConfig: GlobalConfig,
  hasDeprecationWarnings: boolean,
  projectConfig: ProjectConfig,
} {
  let rawOptions;
  let configPath = null;

  if (typeof packageRootOrConfig !== 'string') {
    if (parentConfigPath) {
      const parentConfigDirname = path.dirname(parentConfigPath);
      rawOptions = packageRootOrConfig;
      rawOptions.rootDir = rawOptions.rootDir
        ? replaceRootDirInPath(parentConfigDirname, rawOptions.rootDir)
        : parentConfigDirname;
    } else {
      throw new Error(
        'Jest: Cannot use configuration as an object without a file path.',
      );
    }
  } else if (isJSONString(argv.config)) {
    // A JSON string was passed to `--config` argument and we can parse it
    // and use as is.
    let config;
    try {
      config = JSON.parse(argv.config);
    } catch (e) {
      throw new Error(
        'There was an error while parsing the `--config` argument as a JSON string.',
      );
    }

    // NOTE: we might need to resolve this dir to an absolute path in the future
    config.rootDir = config.rootDir || packageRootOrConfig;
    rawOptions = config;
    // A string passed to `--config`, which is either a direct path to the config
    // or a path to directory containing `package.json` or `jest.config.js`
  } else if (!skipArgvConfigOption && typeof argv.config == 'string') {
    configPath = resolveConfigPath(argv.config, process.cwd());
    rawOptions = readConfigFileAndSetRootDir(configPath);
  } else {
    // Otherwise just try to find config in the current rootDir.
    configPath = resolveConfigPath(packageRootOrConfig, process.cwd());
    rawOptions = readConfigFileAndSetRootDir(configPath);
  }

  const {options, hasDeprecationWarnings} = normalize(rawOptions, argv);
  const {globalConfig, projectConfig} = groupOptions(options);
  return {
    configPath,
    globalConfig,
    hasDeprecationWarnings,
    projectConfig,
  };
}

const groupOptions = (
  options: Object,
): {globalConfig: GlobalConfig, projectConfig: ProjectConfig} => ({
  globalConfig: Object.freeze({
    bail: options.bail,
    changedFilesWithAncestor: options.changedFilesWithAncestor,
    changedSince: options.changedSince,
    collectCoverage: options.collectCoverage,
    collectCoverageFrom: options.collectCoverageFrom,
    collectCoverageOnlyFrom: options.collectCoverageOnlyFrom,
    coverageDirectory: options.coverageDirectory,
    coverageReporters: options.coverageReporters,
    coverageThreshold: options.coverageThreshold,
    detectLeaks: options.detectLeaks,
    detectOpenHandles: options.detectOpenHandles,
    enabledTestsMap: options.enabledTestsMap,
    errorOnDeprecated: options.errorOnDeprecated,
    expand: options.expand,
    filter: options.filter,
    findRelatedTests: options.findRelatedTests,
    forceExit: options.forceExit,
    globalSetup: options.globalSetup,
    globalTeardown: options.globalTeardown,
    json: options.json,
    lastCommit: options.lastCommit,
    listTests: options.listTests,
    logHeapUsage: options.logHeapUsage,
    maxWorkers: options.maxWorkers,
    noSCM: undefined,
    noStackTrace: options.noStackTrace,
    nonFlagArgs: options.nonFlagArgs,
    notify: options.notify,
    notifyMode: options.notifyMode,
    onlyChanged: options.onlyChanged,
    onlyFailures: options.onlyFailures,
    outputFile: options.outputFile,
    passWithNoTests: options.passWithNoTests,
    projects: options.projects,
    replname: options.replname,
    reporters: options.reporters,
    rootDir: options.rootDir,
    runTestsByPath: options.runTestsByPath,
    silent: options.silent,
    skipFilter: options.skipFilter,
    testFailureExitCode: options.testFailureExitCode,
    testNamePattern: options.testNamePattern,
    testPathPattern: options.testPathPattern,
    testResultsProcessor: options.testResultsProcessor,
    updateSnapshot: options.updateSnapshot,
    useStderr: options.useStderr,
    verbose: options.verbose,
    watch: options.watch,
    watchAll: options.watchAll,
    watchPlugins: options.watchPlugins,
    watchman: options.watchman,
  }),
  projectConfig: Object.freeze({
    automock: options.automock,
    browser: options.browser,
    cache: options.cache,
    cacheDirectory: options.cacheDirectory,
    clearMocks: options.clearMocks,
    coveragePathIgnorePatterns: options.coveragePathIgnorePatterns,
    cwd: options.cwd,
    detectLeaks: options.detectLeaks,
    detectOpenHandles: options.detectOpenHandles,
    displayName: options.displayName,
    errorOnDeprecated: options.errorOnDeprecated,
    filter: options.filter,
    forceCoverageMatch: options.forceCoverageMatch,
    globals: options.globals,
    haste: options.haste,
    moduleDirectories: options.moduleDirectories,
    moduleFileExtensions: options.moduleFileExtensions,
    moduleLoader: options.moduleLoader,
    moduleNameMapper: options.moduleNameMapper,
    modulePathIgnorePatterns: options.modulePathIgnorePatterns,
    modulePaths: options.modulePaths,
    name: options.name,
    prettierPath: options.prettierPath,
    resetMocks: options.resetMocks,
    resetModules: options.resetModules,
    resolver: options.resolver,
    restoreMocks: options.restoreMocks,
    rootDir: options.rootDir,
    roots: options.roots,
    runner: options.runner,
    setupFiles: options.setupFiles,
    setupTestFrameworkScriptFile: options.setupTestFrameworkScriptFile,
    skipFilter: options.skipFilter,
    skipNodeResolution: options.skipNodeResolution,
    snapshotResolver: options.snapshotResolver,
    snapshotSerializers: options.snapshotSerializers,
    testEnvironment: options.testEnvironment,
    testEnvironmentOptions: options.testEnvironmentOptions,
    testLocationInResults: options.testLocationInResults,
    testMatch: options.testMatch,
    testPathIgnorePatterns: options.testPathIgnorePatterns,
    testRegex: options.testRegex,
    testRunner: options.testRunner,
    testURL: options.testURL,
    timers: options.timers,
    transform: options.transform,
    transformIgnorePatterns: options.transformIgnorePatterns,
    unmockedModulePathPatterns: options.unmockedModulePathPatterns,
    watchPathIgnorePatterns: options.watchPathIgnorePatterns,
  }),
});

const ensureNoDuplicateConfigs = (parsedConfigs, projects, rootConfigPath) => {
  const configPathMap = new Map();

  for (const config of parsedConfigs) {
    const {configPath} = config;
    if (configPathMap.has(configPath)) {
      const message = `Whoops! Two projects resolved to the same config path: ${chalk.bold(
        String(configPath),
      )}:

  Project 1: ${chalk.bold(projects[parsedConfigs.findIndex(x => x === config)])}
  Project 2: ${chalk.bold(
    projects[parsedConfigs.findIndex(x => x === configPathMap.get(configPath))],
  )}

This usually means that your ${chalk.bold(
        '"projects"',
      )} config includes a directory that doesn't have any configuration recognizable by Jest. Please fix it.
`;

      throw new Error(message);
    }
    if (configPath !== null) {
      configPathMap.set(configPath, config);
    }
  }
};

// Possible scenarios:
//  1. jest --config config.json
//  2. jest --projects p1 p2
//  3. jest --projects p1 p2 --config config.json
//  4. jest --projects p1
//  5. jest
//
// If no projects are specified, process.cwd() will be used as the default
// (and only) project.
export function readConfigs(
  argv: Argv,
  projectPaths: Array<Path>,
): {
  globalConfig: GlobalConfig,
  configs: Array<ProjectConfig>,
  hasDeprecationWarnings: boolean,
} {
  let globalConfig;
  let hasDeprecationWarnings;
  let configs: Array<ProjectConfig> = [];
  let projects = projectPaths;
  let configPath: ?Path;

  if (projectPaths.length === 1) {
    const parsedConfig = readConfig(argv, projects[0]);
    configPath = parsedConfig.configPath;

    if (parsedConfig.globalConfig.projects) {
      // If this was a single project, and its config has `projects`
      // settings, use that value instead.
      projects = parsedConfig.globalConfig.projects;
    }

    hasDeprecationWarnings = parsedConfig.hasDeprecationWarnings;
    globalConfig = parsedConfig.globalConfig;
    configs = [parsedConfig.projectConfig];
    if (globalConfig.projects && globalConfig.projects.length) {
      // Even though we had one project in CLI args, there might be more
      // projects defined in the config.
      projects = globalConfig.projects;
    }
  }

  if (projects.length > 1) {
    const parsedConfigs = projects
      .filter(root => {
        // Ignore globbed files that cannot be `require`d.
        if (
          fs.existsSync(root) &&
          !fs.lstatSync(root).isDirectory() &&
          !root.endsWith('.js') &&
          !root.endsWith('.json')
        ) {
          return false;
        }

        return true;
      })
      .map(root => readConfig(argv, root, true, configPath));

    ensureNoDuplicateConfigs(parsedConfigs, projects, configPath);
    configs = parsedConfigs.map(({projectConfig}) => projectConfig);
    if (!hasDeprecationWarnings) {
      hasDeprecationWarnings = parsedConfigs.some(
        ({hasDeprecationWarnings}) => !!hasDeprecationWarnings,
      );
    }
    // If no config was passed initially, use the one from the first project
    if (!globalConfig) {
      globalConfig = parsedConfigs[0].globalConfig;
    }
  }

  if (!globalConfig || !configs.length) {
    throw new Error('jest: No configuration found for any project.');
  }

  return {
    configs,
    globalConfig,
    hasDeprecationWarnings: !!hasDeprecationWarnings,
  };
}
