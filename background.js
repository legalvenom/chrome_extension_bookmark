chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      videoId: urlParameters.get("v"),
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "DELETE") {
    chrome.storage.sync.get([request.currentVideo], (data) => {
      const currentVideoBookmarks = data[request.currentVideo] ? JSON.parse(data[request.currentVideo]) : [];
      const updatedBookmarks = currentVideoBookmarks.filter(b => b.time != request.value);

      chrome.storage.sync.set({
        [request.currentVideo]: JSON.stringify(updatedBookmarks)
      }, () => {
        sendResponse(updatedBookmarks);
      });
    });

    return true; // Required to use sendResponse asynchronously
  }

  if (request.type === "EDIT") {
    chrome.storage.sync.get([request.currentVideo], (data) => {
      const currentVideoBookmarks = data[request.currentVideo] ? JSON.parse(data[request.currentVideo]) : [];
      const updatedBookmarks = currentVideoBookmarks.map(b => {
        if (b.time == request.value.time) {
          b.desc = request.value.desc;
        }
        return b;
      });

      chrome.storage.sync.set({
        [request.currentVideo]: JSON.stringify(updatedBookmarks)
      }, () => {
        sendResponse(updatedBookmarks);
      });
    });

    return true; // Required to use sendResponse asynchronously
  }
});
