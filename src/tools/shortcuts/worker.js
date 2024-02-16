// eslint-disable-next-line
async function shortcutsWorker() {
    const refresh = (links) => {
        App.setSectionViewProp("shortcuts", "links", links);
    };

    DDDot.onMessage("shortcuts.refresh", (message) => {
        refresh(message.links);
    });

    const response = await DDDot.postMessage({ type: "shortcuts.onReady" });
    refresh(response);
}
