const vscode = acquireVsCodeApi();

let target = "container";
let transparentBackground = false;
let backgroundColor = "#f2f2f2";

vscode.postMessage({
  type: "getAndUpdateCacheAndSettings",
});

const snippetNode = document.getElementById("snippet");

snippetNode.style.opacity = "1";
const oldState = vscode.getState();
if (oldState && oldState.innerHTML) {
  snippetNode.innerHTML = oldState.innerHTML;
}

window.addEventListener("message", (event) => {
  if (event) {
    const { data } = event;

    switch (data.type) {
      case "init":
        const { fontFamily, bgColor } = event.data;

        const initialHtml = getInitialHtml(fontFamily);
        snippetNode.innerHTML = initialHtml;
        vscode.setState({ innerHTML: initialHtml });
        break;
      case "update":
        snippetNode.innerHTML = data.svg;
        break;
      case "restore":
        snippetNode.innerHTML = event.data.innerHTML;
        updateEnvironment(event.data.bgColor);
        break;
      case "updateOptions":
        break;
      case "init":
        break;
    }
  }
});

// Obtuateur
const obturateur = document.getElementById("save");
obturateur.addEventListener("click", () => {
  vscode.postMessage({
    type: "shoot",
    data: snippetNode.innerHTML,
  });
});

let isInAnimation = false;

obturateur.addEventListener("mouseover", () => {
  if (!isInAnimation) {
    isInAnimation = true;

    new Vivus(
      "save",
      {
        duration: 40,
        onReady: () => {
          obturateur.className = "obturateur filling";
        },
      },
      () => {
        setTimeout(() => {
          isInAnimation = false;
          obturateur.className = "obturateur";
        }, 700);
      }
    );
  }
});
