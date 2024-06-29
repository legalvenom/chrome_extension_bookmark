(() => {
    let youtubePlayer;
    let currentVideo = "";
    let autoPauseEnabled = false;
  
    const fetchBookmarks = () => {
      return new Promise((resolve) => {
        chrome.storage.sync.get([currentVideo], (obj) => {
          resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
        });
      });
    };
  
    const addNewBookmarkEventHandler = async () => {
      const currentTime = youtubePlayer.currentTime;
      const newBookmark = {
        time: currentTime,
        desc: "Bookmark at " + getTime(currentTime),
      };
  
      currentVideoBookmarks = await fetchBookmarks();
  
      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
      });
    };
  
    const newVideoLoaded = async () => {
      const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
  
      currentVideoBookmarks = await fetchBookmarks();
  
      if (!bookmarkBtnExists) {
        const bookmarkBtn = document.createElement("img");
  
        bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
        bookmarkBtn.className = "ytp-button " + "bookmark-btn";
        bookmarkBtn.title = "Click to bookmark current timestamp";
  
        const youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
        youtubePlayer = document.getElementsByClassName('video-stream')[0];
  
        youtubeLeftControls.appendChild(bookmarkBtn);
        bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
      }
    };
  
    const handleVisibilityChange = () => {
      if (autoPauseEnabled) {
        if (document.hidden) {
          youtubePlayer.pause();
        } else {
          youtubePlayer.play();
        }
      }
    };
  
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
      const { type, value, videoId } = obj;
  
      if (type === "NEW") {
        currentVideo = videoId;
        newVideoLoaded();
      } else if (type === "PLAY") {
        youtubePlayer.currentTime = value;
      } else if (type === "DELETE") {
        fetchBookmarks().then(currentVideoBookmarks => {
          currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
          chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) }, () => {
            response(currentVideoBookmarks);
          });
        });
        return true; // To indicate async response
      } else if (type === "EDIT") {
        fetchBookmarks().then(currentVideoBookmarks => {
          const bookmarkIndex = currentVideoBookmarks.findIndex(b => b.time == value.time);
          if (bookmarkIndex !== -1) {
            currentVideoBookmarks[bookmarkIndex].desc = value.desc;
            chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) }, () => {
              response(currentVideoBookmarks);
            });
          }
        });
        return true; // To indicate async response
      } else if (type === "AUTOPAUSE_TOGGLE") {
        autoPauseEnabled = !autoPauseEnabled;
        chrome.storage.sync.set({ autoPauseEnabled });
        response(autoPauseEnabled);
      }
    });
  
    newVideoLoaded();
    document.addEventListener("visibilitychange", handleVisibilityChange);
  
    chrome.storage.sync.get(['autoPauseEnabled'], (data) => {
      autoPauseEnabled = data.autoPauseEnabled;
    });
  })();
  
  const getTime = t => {
    var date = new Date(0);
    date.setSeconds(t);
  
    return date.toISOString().substr(11, 8);
  };
  