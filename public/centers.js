let map = L.map("map").setView([13.0827, 80.2707], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let centersData = [];
let markers = [];

async function loadCenters() {
  const res = await fetch("/api/centers");
  centersData = await res.json();

  displayCenters(centersData);
  loadDistrictFilter();
}

/* DISPLAY TABLE + MARKERS */

function displayCenters(centers) {
  const tableBody = document.getElementById("centerTableBody");
  tableBody.innerHTML = "";

  /* Remove old markers */
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  centers.forEach((center, index) => {
    tableBody.innerHTML += `
<tr>
<td>${index + 1}</td>
<td>${center.district}</td>
<td>${center.center_name}</td>
<td>${center.available_containers}</td>
<td>+91 9000000000</td>
</tr>
`;

    const marker = L.marker([center.latitude, center.longitude]).addTo(map);

    marker.bindPopup(`
<b>${center.center_name}</b><br>
${center.address}<br>
Available: ${center.available_containers}
`);

    markers.push(marker);
  });
}

/* LOAD DISTRICT FILTER */

function loadDistrictFilter() {
  const districtSelect = document.getElementById("districtFilter");

  const districts = [...new Set(centersData.map((c) => c.district))];

  districts.forEach((district) => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;

    districtSelect.appendChild(option);
  });
}

/* FILTER BY DISTRICT */

function filterByDistrict() {
  const selectedDistrict = document.getElementById("districtFilter").value;

  if (selectedDistrict === "all") {
    displayCenters(centersData);
  } else {
    const filtered = centersData.filter(
      (center) => center.district === selectedDistrict,
    );

    displayCenters(filtered);
  }
}

loadCenters();
