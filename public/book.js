document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("bookingForm");
  const landInput = document.getElementById("land");
  const unitSelect = document.getElementById("landUnit");
  const containerSelect = document.querySelector('select[name="container_size"]');
  const paddyDisplay = document.getElementById("paddy");
  const containersDisplay = document.getElementById("containers");

  // 🔹 API Base URL (Dynamic for Local vs Vercel/Render)
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE = isLocal ? "http://localhost:5000" : "https://kuru-kalan-backend.onrender.com";

  // 🔹 Conversion rates
  const toHectare = {
    hectare: 1,
    acre: 0.404686,
    veli: 2.62,
    maa: 0.132,
    kuli: 0.00132,
    cent: 0.00404686,
    sqm: 0.0001,
    sqft: 0.0000092903
  };

  // 🔹 Calculate paddy & containers
  function updateCalculations() {
    const landValue = parseFloat(landInput?.value) || 0;
    const unit = unitSelect?.value;
    const containerCapacity = containerSelect?.value === '100sac' ? 5000 : 2500;

    const hectares = landValue * (toHectare[unit] || 1);
    const estimatedPaddy = Math.round(hectares * 6000);
    const containersNeeded = estimatedPaddy > 0
      ? Math.ceil(estimatedPaddy / containerCapacity)
      : 0;

    if (paddyDisplay) paddyDisplay.innerText = estimatedPaddy;
    if (containersDisplay) containersDisplay.innerText = containersNeeded;
  }

  // 🔹 Event listeners
  if (landInput) landInput.addEventListener("input", updateCalculations);
  if (unitSelect) unitSelect.addEventListener("change", updateCalculations);
  if (containerSelect) containerSelect.addEventListener("change", updateCalculations);

  // 🔹 Form submission
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const quantity = parseInt(containersDisplay?.innerText || "0") || 0;
      const bookingDate = form.start_date.value;

      if (!bookingDate) {
        alert("⚠️ Please select a Booking Date.");
        return;
      }

      const formData = new FormData(form);

      // 🔹 Add calculated fields
      formData.set("farmerName", form.name.value);
      formData.set("mobileNumber", form.contact.value);
      formData.set("quantity", quantity);
      formData.set("bookingDate", bookingDate);
      formData.set("estimatedPaddy", paddyDisplay?.innerText || "0");

      // 🔹 Container display mapping
      const cSizeRaw = formData.get("container_size");
      const cSizeDisplay = cSizeRaw === '100sac'
        ? '100 Sacks (5000kg)'
        : '50 Sacks (2500kg)';

      formData.set("containerSize", cSizeDisplay);

      try {
        console.log("Sending request to:", `${API_BASE}/api/book`);

        const response = await fetch(`${API_BASE}/api/book`, {
          method: "POST",
          body: formData
        });

        let result;
        try {
          result = await response.json();
        } catch {
          result = {};
        }

        if (response.ok) {
          alert("✅ Booking Submitted Successfully");
          form.reset();
          updateCalculations();
        } else {
          alert("❌ Error: " + (result.message || "Submission failed"));
        }

      } catch (error) {
        console.error("Error:", error);
        alert("❌ Server not reachable. Please try again later.");
      }
    });
  }

});