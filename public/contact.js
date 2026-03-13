document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const subject = document.getElementById("subject").value;
  const message = document.getElementById("message").value;

  console.log({
    name,
    email,
    phone,
    subject,
    message,
  });

  alert("Message sent successfully!");

  this.reset();
});
