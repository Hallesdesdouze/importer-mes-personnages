chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.type === "EXTRACTION_RESULT" && sender.tab) {
        const count = msg.payload.characters?.length || 0;
        chrome.action.setBadgeText({ text: count ? String(count) : "", tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: "#22c55e", tabId: sender.tab.id });
        chrome.storage.session.set({ [`extraction_${sender.tab.id}`]: msg.payload });
    }
});