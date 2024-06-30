import { getActiveTabURL } from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");
  const editTitleInputElement = document.createElement("input");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";

  editTitleInputElement.className = "edit-title-input";
  editTitleInputElement.value = bookmark.desc;
  editTitleInputElement.style.display = "none";

  controlsElement.className = "bookmark-controls";

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("edit", onEdit, controlsElement);
  setBookmarkAttributes("save", onSave, controlsElement, true);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(editTitleInputElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks = []) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }

  return;
};

const onPlay = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: bookmarkTime,
  });
};

const onDelete = async e => {
  const activeTab = await getActiveTabURL();
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");

  chrome.tabs.sendMessage(activeTab.id, {
    type: "DELETE",
    value: bookmarkTime,
  }, (updatedBookmarks) => {
    viewBookmarks(updatedBookmarks);
  });
};

const onEdit = e => {
  const parent = e.target.parentNode.parentNode;
  const titleElement = parent.querySelector(".bookmark-title");
  const inputElement = parent.querySelector(".edit-title-input");
  const saveButton = parent.querySelector("[title='save']");

  titleElement.style.display = "none";
  inputElement.style.display = "block";
  saveButton.style.display = "inline";
};

const onSave = async e => {
  const parent = e.target.parentNode.parentNode;
  const bookmarkTime = parent.getAttribute("timestamp");
  const titleElement = parent.querySelector(".bookmark-title");
  const inputElement = parent.querySelector(".edit-title-input");
  const saveButton = e.target;

  titleElement.textContent = inputElement.value;
  titleElement.style.display = "block";
  inputElement.style.display = "none";
  saveButton.style.display = "none";

  const activeTab = await getActiveTabURL();
  chrome.tabs.sendMessage(activeTab.id, {
    type: "EDIT",
    value: {
      time: bookmarkTime,
      desc: inputElement.value
    }
  }, (updatedBookmarks) => {
    viewBookmarks(updatedBookmarks);
  });
};

const setBookmarkAttributes = (src, eventListener, controlParentElement, hide = false) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlElement.style.display = hide ? "none" : "inline";
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];

      viewBookmarks(currentVideoBookmarks);
    });
  } else if (activeTab.url.includes("youtube.com")) {
    const container = document.getElementsByClassName("container")[0];

    container.innerHTML = '<div class="title">This is not a youtube video .</div>';
  } else{
    const container = document.getElementsByClassName("container")[0];

    container.innerHTML = '<div class="title">This is not a youtube page .</div>';
  }

  const autoPauseButton = document.getElementById("autopause-btn");
  autoPauseButton.addEventListener("click", async () => {
    const activeTab = await getActiveTabURL();
    chrome.tabs.sendMessage(activeTab.id, {
      type: "AUTOPAUSE_TOGGLE",
    }, (autoPauseEnabled) => {
      autoPauseButton.textContent = autoPauseEnabled ? "Disable AutoPause" : "Enable AutoPause";
    });
  });

  chrome.storage.sync.get(['autoPauseEnabled'], (data) => {
    const autoPauseEnabled = data.autoPauseEnabled;
    autoPauseButton.textContent = autoPauseEnabled ? "Disable AutoPause" : "Enable AutoPause";
  });
});
