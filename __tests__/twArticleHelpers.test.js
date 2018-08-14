import fs from 'fs-extra';
import path from 'path-extra';
// helpers
import * as twArticleHelpers from '../src/helpers/translationHelps/twArticleHelpers';

jest.mock('fs-extra');

describe('Tests for twArticleHelpers', function() {
  beforeEach(() => {
    fs.__resetMockFS();
  });

  it('Test twArticleHelpers.processTranslationWords() for en', () => {
    // given
    const lang = 'en';
    const version = 'v8';
    const actualExtractedPath = path.join(__dirname, 'fixtures/translationHelps/twExtractedFromCDN');
    const mockedExtractedPath = '/tmp/extracted';
    fs.__loadDirIntoMockFs(actualExtractedPath, mockedExtractedPath);
    const outputPath = path.join('/resources', lang, 'translationHelps/translationWords');
    const expectedTwOutputPath = path.join(outputPath, version);
    const expectedTypeList = ['kt', 'names', 'other'];
    const expectedKtArticleListLength = 3;
    const expectedNamesArticleListLength = 2;
    const expectedIndexJson = [{"id": "apostle", "name": "apostle, apostles, apostleship"}, {"id": "god", "name": "God"}, {"id": "sanctify", "name": "sanctify, sanctifies, sanctification"}]    ;

    // when
    const twOutputPath = twArticleHelpers.processTranslationWords(path.join(mockedExtractedPath, lang+'_tw'), outputPath);
    const indexFile = path.join(twOutputPath, 'kt', 'index.json');
    const indexJson = fs.readJsonSync(indexFile);
    const typeList = fs.readdirSync(twOutputPath);
    const ktArticleList = fs.readdirSync(path.join(twOutputPath, 'kt', 'articles'));
    const namesArticleList = fs.readdirSync(path.join(twOutputPath, 'names', 'articles'));
    const godFile = path.join(twOutputPath, 'kt', 'articles', 'god.md');
    const godArticle = fs.readFileSync(godFile, 'utf8');

    // then
    expect(twOutputPath).toEqual(expectedTwOutputPath);
    expect(fs.existsSync(indexFile)).toBeTruthy();
    expect(indexJson).toEqual(expectedIndexJson);
    expect(fs.existsSync(godFile)).toBeTruthy();
    expect(typeList).toEqual(expectedTypeList);
    expect(ktArticleList.length).toEqual(expectedKtArticleListLength);
    expect(ktArticleList).toMatchSnapshot();
    expect(godArticle).toMatchSnapshot();
    expect(namesArticleList.length).toEqual(expectedNamesArticleListLength);
    expect(namesArticleList).toMatchSnapshot();
  });

  it('Test twArticlesHelpers.processTranslationWord() for invalid extractedFilesDir', () => {
    // given
    const extractedPath = '/bad/dir';
    const lang = 'en';
    const expectedTwOutputPath = null;

    // when
    const twOutputPath = twArticleHelpers.processTranslationWords(extractedPath, lang);

    // then
    expect(twOutputPath).toEqual(expectedTwOutputPath);
  });
});