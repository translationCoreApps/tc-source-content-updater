// 'use strict';

import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
import * as moveResourcesHelpers from '../src/helpers/moveResourcesHelpers';

jest.mock('fs-extra');

describe('moveResourcesHelpers', () => {
  let sourceFolder;
  let initialFolder;
  let fromFolder;
  let toFolder;

  beforeEach(() => {
    // simulate download into sourceFolder
    sourceFolder = path.join(__dirname, 'fixtures', 'resources', 'bs');
    // simulate converting into initial folder
    initialFolder = path.join(ospath.home(), 'resources');
    fs.__resetMockFS();
    fs.__loadDirIntoMockFs(sourceFolder, initialFolder);
    fromFolder = initialFolder;
    toFolder = path.join(__dirname, 'translationCore', 'resources', 'bs');
  });

  test('moveResources: copy bible books', () => {
    moveResourcesHelpers.moveResources(fromFolder, toFolder);
    const deepFolder = fs.__catMockFS(path.join(
        toFolder, 'bibles', 'v1', 'mat'));
    const chapter1 = JSON.stringify([
      "1.json"
    ], null, 2);

    expect(deepFolder).toEqual(chapter1);
  });

  test('moveResources: copy lexicons', () => {
    moveResourcesHelpers.moveResources(fromFolder, toFolder);
    const deepFolder = fs.__catMockFS(path.join(
        toFolder, 'lexicons', 'ugl', 'v1', 'content'));
    const aWord = JSON.stringify([
      "beauty.json"
    ], null, 2);

    expect(deepFolder).toEqual(aWord);
  });

  test('moveResources: copy translation helps', () => {
    moveResourcesHelpers.moveResources(fromFolder, toFolder);
    const deepFolder = fs.__catMockFS(path.join(
        toFolder, 'translationHelps', 'translationAcademy', 'v9', 'process'));
    const share = JSON.stringify([
      "share-content.md"
    ], null, 2);

    expect(deepFolder).toEqual(share);
  });
});

