// Service worker rozšíření: po první instalaci otevře nastavení, aby šlo hned zvolit zdroj ověření.

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) chrome.runtime.openOptionsPage();
});
