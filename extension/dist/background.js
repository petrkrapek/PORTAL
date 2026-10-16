chrome.runtime.onInstalled.addListener(({reason:e})=>{e===chrome.runtime.OnInstalledReason.INSTALL&&chrome.runtime.openOptionsPage()});
