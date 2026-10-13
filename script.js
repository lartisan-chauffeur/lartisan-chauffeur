const serviceType = document.getElementById("serviceType");
const distanceField = document.getElementById("distanceField");
const hoursField = document.getElementById("hoursField");
const form = document.getElementById("reservationForm");
const formMessage = document.getElementById("formMessage");
const priceDisplay = document.getElementById("priceDisplay");
const sendWhatsApp = document.getElementById("sendWhatsApp");

const FORM_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

function toggleFields() {
  const value = serviceType.value;
  distanceField.style.display = value === "point" ? "flex" : "none";
  hoursField.style.display = value === "dispo" ? "flex" : "none";

  const distance = document.getElementById("distance");
  const hours = document.getElementById("hours");

  distance.required = value === "point";
  hours.required = value === "dispo";

  if (value !== "point") distance.value = "";
  if (value !== "dispo") hours.value = "";

  calculatePrice();
}

function calculatePrice() {
  const type = serviceType.value;
  const luggage = Number(document.getElementById("bags").value || 0);
  const vehicle = document.getElementById("vehicle").value;
  const extraBags = Math.max(0, luggage - 2);
  const bagCost = extraBags * 3;

  let price = 0;

  if (type === "point") {
    const km = Number(document.getElementById("distance").value || 0);
    if (km > 0) {
      const rate = km < 50 ? 2 : 2.4;
      price = km * rate + bagCost;
    }
  }

  if (type === "dispo") {
    const hours = Number(document.getElementById("hours").value || 0);
    if (hours > 0) {
      let hourly = 65;
      if (vehicle === "van") hourly = 85;
      if (vehicle === "minibus") hourly = 120;
      if (vehicle === "autocar") hourly = 180;
      price = hours * hourly + bagCost;
    }
  }

  priceDisplay.textContent = price > 0 ? Math.round(price) + " €" : "— €";
}

["serviceType", "distance", "hours", "bags", "vehicle", "from", "to", "datetime", "comments", "name", "phone", "email"].forEach((id) => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener("input", calculatePrice);
    element.addEventListener("change", calculatePrice);
  }
});

serviceType.addEventListener("change", toggleFields);

function validateForm() {
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }

  if (serviceType.value === "point" && (!document.getElementById("distance").value || Number(document.getElementById("distance").value) <= 0)) {
    formMessage.textContent = "Veuillez renseigner une distance estimée.";
    formMessage.classList.add("visible");
    return false;
  }

  if (serviceType.value === "dispo" && (!document.getElementById("hours").value || Number(document.getElementById("hours").value) <= 0)) {
    formMessage.textContent = "Veuillez renseigner une durée estimée.";
    formMessage.classList.add("visible");
    return false;
  }

  formMessage.textContent = "";
  formMessage.classList.remove("visible");
  return true;
}

function buildMessage(data) {
  const price = priceDisplay.textContent;
  return [
    "Demande de réservation L'Artisan Chauffeur",
    "",
    `Nom: ${data.name || "-"}`,
    `Téléphone: ${data.phone || "-"}`,
    `Email: ${data.email || "-"}`,
    `Service: ${data.serviceType || "-"}`,
    `Distance: ${data.distance || "-"} km`,
    `Durée: ${data.hours || "-"} h`,
    `Véhicule: ${data.vehicle || "-"}`,
    `Bagages: ${data.bags || "-"}`,
    `Départ: ${data.from || "-"}`,
    `Destination: ${data.to || "-"}`,
    `Date/Heure: ${data.datetime || "-"}`,
    `Commentaires: ${data.comments || "-"}`,
    "",
    `Prix estimé: ${price}`
  ].join("\n");
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!validateForm()) return;

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    formMessage.textContent = "Envoi en cours...";
    formMessage.classList.add("visible");

    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        email: data.email,
        serviceType: data.serviceType,
        distance: data.distance || "",
        hours: data.hours || "",
        vehicle: data.vehicle,
        bags: data.bags,
        from: data.from,
        to: data.to,
        datetime: data.datetime,
        comments: data.comments,
        priceEstimate: priceDisplay.textContent
      })
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'envoi");
    }

    form.reset();
    toggleFields();
    formMessage.textContent = "Votre demande a bien été envoyée. Nous vous répondrons rapidement.";
    formMessage.classList.add("visible");

  } catch (error) {
    formMessage.textContent = "Une erreur technique est survenue. Vous pouvez nous écrire directement par email ou WhatsApp.";
    formMessage.classList.add("visible");
  }
});

sendWhatsApp.addEventListener("click", function (event) {
  if (!validateForm()) {
    event.preventDefault();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  const message = buildMessage(data) + "\n\n(Envoyé depuis le site L'Artisan Chauffeur)";
  const waUrl = "https://wa.me/?text=" + encodeURIComponent(message);

  sendWhatsApp.setAttribute("href", waUrl);
});

toggleFields();
