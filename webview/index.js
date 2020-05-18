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
const themeNames = document.getElementById("themeNames");

themeNames.addEventListener("change", (event) => {
  const targetTheme = themeNames.value;
  vscode.postMessage({
    type: "changeTheme",
    data: { targetTheme },
  });
});

function getCurrentOptions() {
  return {
    fontSize: +document.getElementById("fontSize").value,
    leading: +document.getElementById("leading").value,
    lineCap: document.getElementById("lineCap").value,
    margin: +document.getElementById("margin").value,
    lineNumbers: document.getElementById("lineNumbers").value === "true",
    lineNumberOffset: +document.getElementById("lineNumberOffset").value,
  };
}

function updateOptions() {
  vscode.postMessage({
    type: "updateOptions",
    data: { options: getCurrentOptions() },
  });
}

const optionIds = [
  "fontSize",
  "leading",
  "lineCap",
  "margin",
  "lineNumbers",
  "lineNumberOffset",
];

optionIds.forEach((id) => {
  const element = document.getElementById(id);
  element.addEventListener("change", updateOptions);
});

window.addEventListener("message", (event) => {
  if (event) {
    const { data } = event;
    const { options, themeNames: names, svg } = data;
    switch (data.type) {
      case "init":
        names.forEach((name) => {
          const option = document.createElement("option");
          option.value = name;
          option.text = name;
          themeNames.appendChild(option);
        });

        const {
          fontSize,
          leading,
          lineCap,
          margin,
          lineNumbers,
          lineNumberOffset,
        } = options;

        document.getElementById("fontSize").value = fontSize;
        document.getElementById("leading").value = leading;
        document.getElementById("lineCap").value = lineCap;
        document.getElementById("margin").value = margin;
        document.getElementById("lineNumbers").value = lineNumbers;
        document.getElementById("lineNumberOffset").value = lineNumberOffset;

        break;
      case "update":
        snippetNode.innerHTML = svg;
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
