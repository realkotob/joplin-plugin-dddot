// eslint-disable-next-line
async function backlinksWorker() {
    const refresh = (links) => {
        App.setSectionViewProp("backlinks", "links", links);
    };

    DDDot.onMessage("backlinks.refresh", (message) => {
        refresh(message.links);
    });

    const response = await DDDot.postMessage({
        type: "backlinks.onReady",
    });
    refresh(response);
}
