const vscode = acquireVsCodeApi();

const snippetNode = document.getElementById("snippet");

const themeNames = document.getElementById("themeNames");

const oldState = vscode.getState();
if (oldState) init(oldState.themeNames, oldState.options, oldState.svg);

function updateState() {
  const names = [];

  for (let i = 0; i < themeNames.length; i++) {
    names.push(themeNames.options[i].value);
  }

  const state = {
    options: getCurrentOptions(),
    themeNames: names,
    svg: snippetNode.innerHTML,
  };

  vscode.setState(state);
}

function getCurrentOptions() {
  const options = {
    fontSize: +document.getElementById("fontSize").value,
    leading: +document.getElementById("leading").value,
    lineCap: document.getElementById("lineCap").value,
    margin: +document.getElementById("margin").value,
    lineNumbers: document.getElementById("lineNumbers").checked,
    lineNumberOffset: +document.getElementById("lineNumberOffset").value,
    themeName: themeNames.value,
  };

  return options;
}

function updateOptions() {
  vscode.postMessage({
    type: "updateOptions",
    data: { options: getCurrentOptions() },
  });
  updateState();
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

themeNames.addEventListener("change", (event) => {
  const targetTheme = themeNames.value;
  vscode.postMessage({
    type: "changeTheme",
    data: { targetTheme },
  });
});

function init(names, options, svg) {
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
  themeNames.value = options.themeName;

  document.getElementById("fontSize").value = fontSize;
  document.getElementById("leading").value = leading;
  document.getElementById("lineCap").value = lineCap;
  document.getElementById("margin").value = margin;
  document.getElementById("lineNumbers").checked = lineNumbers;
  document.getElementById("lineNumberOffset").value = lineNumberOffset;

  if (svg) {
    snippetNode.innerHTML = svg;
  }

  updateState();
}
window.addEventListener("message", (event) => {
  if (!event) return;

  const { data } = event;
  const { options, themeNames: names, svg } = data;

  switch (data.type) {
    case "init":
      init(names, options, svg);
      break;
    case "update":
      snippetNode.innerHTML = svg;
      updateState();
      break;
    case "restore":
      init(names, options, svg);
      break;
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
