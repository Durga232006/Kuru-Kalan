document.addEventListener("DOMContentLoaded", function () {
  /* =====================================
     HERO IMAGE CAROUSEL (INDEX PAGE)
  ===================================== */
  const slides = document.querySelectorAll(".slide");

  if (slides.length > 0) {
    let i = 0;

    setInterval(() => {
      slides[i].classList.remove("active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("active");
    }, 4000);
  }

  /* =====================================
     CONTACT PAGE - MAP + CENTERS
  ===================================== */

  if (document.getElementById("map")) {
    const map = L.map("map").setView([13.0827, 80.2707], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    async function loadCenters() {
      try {
        const res = await fetch("/api/centers");
        const centers = await res.json();

        const tableBody = document.getElementById("centerTableBody");

        centers.forEach((center, index) => {
          if (tableBody) {
            tableBody.innerHTML += `
              <tr>
                <td>${index + 1}</td>
                <td>${center.district}</td>
                <td>${center.center_name}</td>
                <td>${center.available_containers}</td>
                <td>${center.mobile || "+91 9000000000"}</td>
              </tr>
            `;
          }

          const marker = L.marker([center.latitude, center.longitude]).addTo(
            map,
          );

          marker.bindPopup(`
            <b>${center.center_name}</b><br>
            ${center.address}<br>
            Available: ${center.available_containers}
          `);
        });
      } catch (error) {
        console.error("Error loading centers:", error);
      }
    }

    loadCenters();
  }

  /* =====================================
     BOOKING PAGE CALCULATION
  ===================================== */

  const landInput = document.getElementById("land");
  const unitInput = document.getElementById("landUnit");

  if (landInput && unitInput) {
    const paddyOutput = document.getElementById("paddy");
    const containerOutput = document.getElementById("containers");

    function calculatePaddy() {
      let land = parseFloat(landInput.value) || 0;
      let unit = unitInput.value;

      // convert everything to hectare
      let hectare = 0;

      switch (unit) {
        case "acre":
          hectare = land * 0.4047;
          break;

        case "veli":
          hectare = land * 2.64;
          break;

        case "maa":
          hectare = land * 0.132;
          break;

        case "kuli":
          hectare = land * 0.0033;
          break;

        case "cent":
          hectare = land * 0.004;
          break;

        case "sqm":
          hectare = land / 10000;
          break;

        case "sqft":
          hectare = land / 107639;
          break;

        default:
          hectare = land;
      }

      // Paddy production estimate
      const paddy = hectare * 5000;

      const containers = Math.ceil(paddy / 5000);

      if (paddyOutput) paddyOutput.innerText = Math.round(paddy);
      if (containerOutput) containerOutput.innerText = containers;
    }

    landInput.addEventListener("input", calculatePaddy);
    unitInput.addEventListener("change", calculatePaddy);
  }

  /* =====================================
     BOOKING FORM SUBMIT
  ===================================== */

  const bookingForm = document.getElementById("bookingForm");

  if (bookingForm) {
    bookingForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(bookingForm);

      try {
        const res = await fetch("/api/bookings", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        alert("Booking successful!");

        bookingForm.reset();
      } catch (error) {
        alert("Error submitting booking");
      }
    });
  }

  /* =====================================
     ADMIN LOGIN
  ===================================== */

  window.login = function () {
    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "admin123";

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      window.location.href = "admin-dashboard.html";
    } else {
      alert("Invalid username or password");
    }
  };

  /* =====================================
     ADMIN DASHBOARD DATA
  ===================================== */

  const bookingTable = document.querySelector("#bookingTable tbody");

  if (bookingTable) {
    async function loadBookings() {
      try {
        const res = await fetch("/api/bookings");
        const bookings = await res.json();

        bookingTable.innerHTML = "";

        let booked = 0;

        bookings.forEach((b) => {
          booked += parseInt(b.containers_required);

          bookingTable.innerHTML += `
            <tr>
              <td>${b._id}</td>
              <td><img src="${b.photo || ""}" width="50"></td>
              <td>${b.name}</td>
              <td>${b.contact}</td>
              <td>${b.address}</td>
              <td>${b.land}</td>
              <td>${b.paddy}</td>
              <td>${b.container_size}</td>
              <td>${b.containers_required}</td>
              <td>${b.start_date}</td>
            </tr>
          `;
        });

        const total = 200;

        document.querySelector("#totalContainers p").innerText = total;
        document.querySelector("#bookedContainers p").innerText = booked;
        document.querySelector("#availableContainers p").innerText =
          total - booked;
      } catch (error) {
        console.error("Dashboard error:", error);
      }
    }

    loadBookings();
  }
});
