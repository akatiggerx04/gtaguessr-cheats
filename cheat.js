let gameLocations = [];
let isBusy = false;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isInNormalMode() {
  var infoDiv = document.querySelector("div.info");
  if (infoDiv) {
    var totalDiv = infoDiv.querySelector("div.total");
    if (totalDiv) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function clickMapCenter() {
  const panelElement = document.querySelector('[data-control="Panel"]');
  const panelRect = panelElement.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  const remainingWidth = screenWidth - panelRect.width;
  const x = panelRect.width + remainingWidth / 2;
  const y = window.innerHeight / 2 - 15;
  const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window,
    detail: 1,
    clientX: x,
    clientY: y,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    button: 0,
    buttons: 1,
    relatedTarget: null,
    screenX: x,
    screenY: y,
    pageX: x,
    pageY: y,
    movementX: 0,
    movementY: 0,
    offsetDirection: 0,
    layerX: x,
    layerY: y,
    fromElement: null,
    toElement: document.elementFromPoint(x, y),
    currentTarget: document.elementFromPoint(x, y),
    target: document.elementFromPoint(x, y),
    isTrusted: true,
  });
  document.elementFromPoint(x, y).dispatchEvent(clickEvent);
}

async function getVersusLocations() {
  if (isBusy) {
    return;
  }

  isBusy = true;

  const lobbyID = localStorage.getItem("lobbyId");
  const lobbyUserID = localStorage.getItem("lobbyUserId");

  let response = await fetch("https://gtaguessr.com/API/GetVersusLocations", {
    method: "POST",
    body: JSON.stringify({
      lobbyId: lobbyID,
      lobyUserId: lobbyUserID,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  response = await response.json();
  gameLocations = response?.locations ?? [];

  isBusy = false;
}

async function getLocationByID(id) {
  selectedRound = id + 1;
  const lobbyID = localStorage.getItem("lobbyId");
  const lobbyUserID = localStorage.getItem("lobbyUserId");

  let response = await fetch("https://gtaguessr.com/API/SubmitAGuess", {
    method: "POST",
    body: JSON.stringify({
      sessionId: getRandomInt(10000000, 99999999).toString(),
      locationId: gameLocations[id]?.locationId ?? 0,
      lat: `${getRandomInt(-7000, 7000)}.${getRandomInt(0, 99999)}`,
      lng: `${getRandomInt(7000, 7000)}.${getRandomInt(0, 99999)}`,
      lobyId: getRandomInt(10000000, 99999999).toString(),
      lobyUserId: getRandomInt(555555, 999999).toString(),
      game: getRandomInt(1, 5).toString(),
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  response = await response.json();
  const lat = response?.lat ?? 0;
  const lng = response?.lng ?? 0;

  return { lat, lng };
}

async function setLocation(locationID) {
  if (isBusy) {
    return;
  }

  isBusy = true;

  changeCopyrightText("Finding the exact coordinates...");
  let exactLocation;

  const mapElement = document.querySelector('[data-control="Map"]');
  mapElement.style.transition = "filter 200ms";
  mapElement.style.filter = "grayscale(1) brightness(20%)";
  document.body.style.cursor = "progress";

  try {
    exactLocation = await getLocationByID(locationID);
  } catch {
    alert("Error while finding exact location");
    mapElement.style.filter = "grayscale(0) brightness(100%)";
    document.body.style.cursor = "inherit";
    return;
  }

  window.location.href =
    "/Guess#5/" + exactLocation.lat + "/" + exactLocation.lng;

  changeCopyrightText("Setting map marker...");

  await new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
  clickMapCenter();

  mapElement.style.filter = "grayscale(0) brightness(100%)";
  document.body.style.cursor = "inherit";

  isBusy = false;

  changeCopyrightText(
    "Select the round number to locate the coordinates for it",
  );
}

// UI

function changeCopyrightText(text) {
  const element = document.getElementById("copyright");
  element.innerText = "© GtaGuessr | " + text;
}

async function getLocationsAndInitUI() {
  if (document.getElementById("cheatLocations")) {
    document.getElementById("cheatLocations").remove();
    changeCopyrightText("Reloading Locations...");
  } else {
    changeCopyrightText("Finding Locations...");
  }

  try {
    await getVersusLocations();
  } catch (e) {
    alert("Error while getting locations!");
    console.error(e.message);
    return;
  }

  changeCopyrightText(
    "Select the round number to locate the coordinates for it",
  );

  document.getElementById("cheatFindLocations").remove();

  const targetElement = document.querySelector('[data-control="Panel"]');

  const newElement = document.createElement("div");
  newElement.id = "cheatLocations";
  newElement.style.display = "grid";
  newElement.style.gridTemplateColumns = "repeat(5, 1fr)";
  newElement.style.columnGap = "5px";
  newElement.style.marginBottom = "5px";

  const buttons = [
    { id: "setFirstLocation", onclick: "setLocation(0);", text: "1" },
    { id: "setSecondLocation", onclick: "setLocation(1);", text: "2" },
    { id: "setThirdLocation", onclick: "setLocation(2);", text: "3" },
    { id: "setFourthLocation", onclick: "setLocation(3);", text: "4" },
    { id: "setFifthLocation", onclick: "setLocation(4);", text: "5" },
  ];

  buttons.forEach((button) => {
    const buttonElement = document.createElement("button");
    buttonElement.id = button.id;
    buttonElement.style.backgroundColor = "#f83849";
    buttonElement.style.border = "none";
    buttonElement.style.padding = "10px 10px";
    buttonElement.style.width = "100%";
    buttonElement.style.fontWeight = "500";
    buttonElement.style.color = "white";
    buttonElement.onclick = new Function(button.onclick);
    buttonElement.textContent = button.text;
    newElement.appendChild(buttonElement);
  });

  targetElement.insertBefore(newElement, targetElement.firstChild);
}

async function activateCheats() {
  if (window.location.host != "gtaguessr.com") {
    alert(
      "Unsupported website! Cheats only work on gtaguessr.com (Versus Mode)!",
    );
    return;
  }

  if (!document.querySelector('[data-control="Map"]')) {
    alert("Cheats can only be initiated while in game (Versus Mode)!");
    return;
  }

  if (isInNormalMode()) {
    alert("Normal Mode is not supported! Only Versus Mode is!");
    return;
  }

  if (document.body.attributes["cheats-init"]) {
    alert("Cheats already activated!");
    return;
  } else {
    document.body.attributes["cheats-init"] = "yes";
  }

  const findLocationsCheatElement = document.createElement("button");

  findLocationsCheatElement.style.border = "none";
  findLocationsCheatElement.id = "cheatFindLocations";
  findLocationsCheatElement.style.backgroundColor = "#f83849";
  findLocationsCheatElement.style.padding = "10px 50px";
  findLocationsCheatElement.style.fontWeight = "500";
  findLocationsCheatElement.style.color = "white";
  findLocationsCheatElement.style.zIndex = "9999999999";
  findLocationsCheatElement.style.bottom = "50px";
  findLocationsCheatElement.style.position = "absolute";
  findLocationsCheatElement.style.right = "20px";
  findLocationsCheatElement.onclick = getLocationsAndInitUI;
  findLocationsCheatElement.textContent = "Find Locations";

  document.body.insertBefore(
    findLocationsCheatElement,
    document.body.firstChild,
  );

  changeCopyrightText("Versus Mode Cheats Activated");
}

activateCheats();
