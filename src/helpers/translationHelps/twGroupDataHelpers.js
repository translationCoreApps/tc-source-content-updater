import fs from 'fs-extra';
import path from 'path-extra';
import * as bible from '../../resources/bible';
// helpers
import * as ResourcesHelpers from '../ResourcesHelpers';

/**
 * @description Generates the tW Group Data files from the given aligned Bible
 * @param {string} biblePath Path to the Bible with aligned data
 * @param {string} outputPath Path where the translationWords group data is to be placed WITHOUT version
 * @return {string} Path where tW was generated with version
 */
export const generateTwGroupDataFromAlignedBible = (biblePath, outputPath) => {
  if (!fs.pathExistsSync(biblePath)) {
    return null;
  }
  const version = ResourcesHelpers.getVersionFromManifest(biblePath);
  if (!version) {
    return null;
  }
  const twOutputPath = path.join(outputPath, 'v' + version);
  let books = bible.BIBLE_LIST_NT.slice(0);
  books.forEach(bookName => {
    convertBookVerseObjectsToTwData(biblePath, twOutputPath, bookName);
  });
  return twOutputPath;
};

/**
 * @description Gets verseObjects of a book and converts to a tW data object to save to file
 * @param {string} biblePath Usually path to the UGNT
 * @param {string} twPath The output path for tW files
 * @param {string} bookName Book in format, e.g. '41-MAT'
 */
function convertBookVerseObjectsToTwData(biblePath, twPath, bookName) {
  const bookId = getbookId(bookName);
  let twData = {};
  const bookDir = path.join(biblePath, bookId);
  if (fs.existsSync(bookDir)) {
    const chapters = Object.keys(bible.BOOK_CHAPTER_VERSES[bookId]).length;
    for (let chapter = 1; chapter <= chapters; chapter++) {
      const chapterFile = path.join(bookDir, chapter + '.json');
      if (fs.existsSync(chapterFile)) {
        const json = JSON.parse(fs.readFileSync(chapterFile));
        for (let verse in json) {
          let groupData = [];
          json[verse].verseObjects.forEach(verseObject => {
            populateGroupDataFromVerseObject(groupData, verseObject);
          });
          populateTwDataFromGroupData(twData, groupData, bookId, chapter, verse);
        }
      }
    }
    for (let category in twData) {
      for (let groupId in twData[category]) {
        let groupPath = path.join(twPath, category, 'groups', bookId, groupId + '.json');
        fs.outputFileSync(groupPath, JSON.stringify(twData[category][groupId], null, 2));
      }
    }
  }
}

/**
 * @description Populates the groupData array with this verseObject and returns its own groupData for milestones
 * @param {object} groupData Group Data object
 * @param {object} verseObject Verse object
 * @param {bool} isMilestone If true, all word objects will be added to the group data
 * @return {object} Returns group data for this verse object
 */
function populateGroupDataFromVerseObject(groupData, verseObject, isMilestone = false) {
  var myGroupData = {
    quote: [],
    strong: []
  };
  if (verseObject.type === 'milestone' || (verseObject.type === 'word' && (verseObject.tw || isMilestone))) {
    if (verseObject.type === 'milestone') {
      if (verseObject.text) {
        myGroupData.text.push(verseObject.text);
      }
      verseObject.children.forEach(childVerseObject => {
        let childGroupData = populateGroupDataFromVerseObject(groupData, childVerseObject, true);
        if (childGroupData) {
          myGroupData.quote = myGroupData.quote.concat(childGroupData.quote);
          myGroupData.strong = myGroupData.strong.concat(childGroupData.strong);
        }
      });
    } else if (verseObject.type === 'word') {
      myGroupData.quote.push(verseObject.text);
      myGroupData.strong.push(verseObject.strong);
    }
    if (myGroupData.quote.length) {
      if (verseObject.tw) {
        const twLinkItems = verseObject.tw.split('/');
        const groupId = twLinkItems.pop();
        const category = twLinkItems.pop();
        if (!groupData[category]) {
          groupData[category] = {};
        }
        if (!groupData[category][groupId]) {
          groupData[category][groupId] = [];
        }
        groupData[category][groupId].push({
          quote: myGroupData.quote.join(' '),
          strong: myGroupData.strong
        });
      }
    }
  }
  return myGroupData;
}

/**
 * @description Takes what is in the groupData array and populates the tWData
 * @param {Object} twData Data to be collected for tw
 * @param {Object} groupData Group data object
 * @param {String} bookId Three character code for the book
 * @param {int} chapter Number of the chapter
 * @param {int} verse Number of the verse
 */
function populateTwDataFromGroupData(twData, groupData, bookId, chapter, verse) {
  for (let category in groupData) {
    if (!twData[category]) {
      twData[category] = [];
    }
    for (let groupId in groupData[category]) {
      if (!twData[category][groupId]) {
        twData[category][groupId] = [];
      }
      let occurrences = {};
      groupData[category][groupId].forEach(item => {
        if (!occurrences[item.quote]) {
          occurrences[item.quote] = 1;
        }
        twData[category][groupId].push({
          priority: 1,
          comments: false,
          reminders: false,
          selections: false,
          verseEdits: false,
          contextId: {
            reference: {
              bookId: bookId,
              chapter: chapter,
              verse: parseInt(verse)
            },
            tool: 'translationWords',
            groupId: groupId,
            quote: item.quote,
            strong: item.strong,
            occurrence: occurrences[item.quote]++
          }
        });
      });
    }
  }
}

/**
 * @description Splits book code out of book name, for example 'mat' from '41-MAT'
 * @param {string} bookName Book in format '41-MAT'
 * @return {string} The book ID, e.g. 'mat'
 */
function getbookId(bookName) {
  return bookName.split('-')[1].toLowerCase();
}