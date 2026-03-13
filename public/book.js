document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("bookingForm");
  const landInput = document.getElementById("land");
  const unitSelect = document.getElementById("landUnit");
  const containerSelect = document.querySelector('select[name="container_size"]');
  const paddyDisplay = document.getElementById("paddy");
  const containersDisplay = document.getElementById("containers");

  // Conversion rates to Hectares for estimation
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

  function updateCalculations() {
    const landValue = parseFloat(landInput.value) || 0;
    const unit = unitSelect.value;
    const containerCapacity = containerSelect.value === '100sac' ? 5000 : 2500;

    const hectares = landValue * (toHectare[unit] || 1);
    const estimatedPaddy = Math.round(hectares * 6000);
    const containersNeeded = estimatedPaddy > 0 ? Math.ceil(estimatedPaddy / containerCapacity) : 0;

    if (paddyDisplay) paddyDisplay.innerText = estimatedPaddy;
    if (containersDisplay) containersDisplay.innerText = containersNeeded;
  }

  if (landInput) landInput.addEventListener("input", updateCalculations);
  if (unitSelect) unitSelect.addEventListener("change", updateCalculations);
  if (containerSelect) containerSelect.addEventListener("change", updateCalculations);

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const quantity = parseInt(containersDisplay ? containersDisplay.innerText : "0") || 0;
      const bookingDate = form.start_date.value;

      if (!bookingDate) {
        alert("Please select a Booking Date.");
        return;
      }

      // Use FormData to handle file upload
      const formData = new FormData(form);

      // Add calculated fields to FormData
      formData.set("farmerName", form.name.value);
      formData.set("mobileNumber", form.contact.value);
      formData.set("quantity", quantity);
      formData.set("bookingDate", bookingDate);
      formData.set("estimatedPaddy", paddyDisplay ? paddyDisplay.innerText : "0");

      // Map container size display name
      const cSizeRaw = formData.get("container_size");
      const cSizeDisplay = cSizeRaw === '100sac' ? '100 Sacks (5000kg)' : '50 Sacks (2500kg)';
      formData.set("containerSize", cSizeDisplay);

      try {
        const response = await fetch('/api/book', {
          method: 'POST',
          // Note: Content-Type header must NOT be set when sending FormData
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          alert("Booking Submitted Successfully.");
          form.reset();
          updateCalculations();
        } else {
          alert("Error: " + (result.error || result.message || "Submission failed. Please try again."));
        }
      } catch (error) {
        console.error("Submission error:", error);
        alert("Could not connect to the server. Please make sure the server is running.");
      }
    });
  }
});