let map = L.map("map").setView([11.1271, 78.6569], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let markers = [];

/* DISPLAY CENTERS AND AUTO-ZOOM */
function displayCenters(data) {
  const tableBody = document.getElementById("centerTableBody");

  tableBody.innerHTML = "";

  /* remove old markers */
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  data.forEach((center, index) => {
    tableBody.innerHTML += `
<tr>
<td>${index + 1}</td>
<td>${center.district}</td>
<td>${center.center_name}</td>
<td>${center.available_containers}</td>
<td>${center.mobile}</td>
</tr>
`;

    const marker = L.marker([center.latitude, center.longitude]);

    marker.bindPopup(`
<b>${center.center_name}</b><br>
${center.district}<br>
Available Containers: ${center.available_containers}
`);

    marker.addTo(map);
    markers.push(marker);
  });

  /* Auto-zoom to fit the displayed markers */
  if (markers.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [20, 20], maxZoom: 12 });
  } else {
    // Zoom back to state view if no centers found
    map.setView([11.1271, 78.6569], 7);
  }
}

/* SEARCH FILTER */
function filterCenters() {
  const search = document.getElementById("searchInput").value.toLowerCase();

  const filtered = centersData.filter(
    (center) =>
      center.district.toLowerCase().includes(search) ||
      center.center_name.toLowerCase().includes(search),
  );

  displayCenters(filtered);
}

/* SEARCH EVENT - use 'input' for better datalist support */
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", filterCenters);
searchInput.addEventListener("keyup", filterCenters);

/* INITIAL LOAD */
displayCenters(centersData);
