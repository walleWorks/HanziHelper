chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['hanzi-writer.min.js', 'content.js']
  });
  chrome.scripting.insertCSS({
    target: {tabId: tab.id},
    files: ['styles.css']
  });
});
