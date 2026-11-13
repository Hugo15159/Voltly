
"use strict";

const powerInput = document.getElementById("power");
const hoursInput = document.getElementById("hours");
const priceInput = document.getElementById("price");
const currencyInput = document.getElementById("currency");

const dailyCostElement = document.getElementById("dailyCost");
const monthlyCostElement = document.getElementById("monthlyCost");
const yearlyCostElement = document.getElementById("yearlyCost");
const dailyKwhElement = document.getElementById("dailyKwh");
const errorElement = document.getElementById("error");

function formatMoney(value, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function clearResults() {
  dailyCostElement.textContent = "—";
  monthlyCostElement.textContent = "—";
  yearlyCostElement.textContent = "—";
  dailyKwhElement.textContent = "—";
}

function calculateElectricityCost() {
  const powerText = powerInput.value.trim();
  const hoursText = hoursInput.value.trim();
  const priceText = priceInput.value.trim();

  const power = Number(powerText);
  const hours = Number(hoursText);
  const price = Number(priceText);
  const currency = currencyInput.value;

  const valid =
    powerText !== "" &&
    hoursText !== "" &&
    priceText !== "" &&
    Number.isFinite(power) &&
    Number.isFinite(hours) &&
    Number.isFinite(price) &&
    power >= 0 &&
    hours >= 0 &&
    hours <= 24 &&
    price >= 0;

  if (!valid) {
    errorElement.textContent =
      "Please enter valid values. Daily usage must be between 0 and 24 hours.";
    errorElement.hidden = false;
    clearResults();
    return;
  }

  const dailyKwh = power * hours / 1000;
  const dailyCost = dailyKwh * price;
  const monthlyCost = dailyCost * 30;
  const yearlyCost = dailyCost * 365;

  if (![dailyKwh, dailyCost, monthlyCost, yearlyCost]
      .every(Number.isFinite)) {
    errorElement.textContent =
      "Values are too large. Please enter smaller numbers.";
    errorElement.hidden = false;
    clearResults();
    return;
  }

  errorElement.hidden = true;
  dailyCostElement.textContent = formatMoney(dailyCost, currency);
  monthlyCostElement.textContent = formatMoney(monthlyCost, currency);
  yearlyCostElement.textContent = formatMoney(yearlyCost, currency);
  dailyKwhElement.textContent = dailyKwh.toFixed(2) + " kWh";
}

[powerInput, hoursInput, priceInput, currencyInput]
  .forEach(input => {
    input.addEventListener("input", calculateElectricityCost);
    input.addEventListener("change", calculateElectricityCost);
  });

document.getElementById("resetButton")
  .addEventListener("click", () => {
    powerInput.value = "1500";
    hoursInput.value = "4";
    priceInput.value = "0.20";
    currencyInput.value = "USD";
    calculateElectricityCost();
  });

const themeButton = document.getElementById("themeToggle");

function updateThemeButton() {
  const isDark = document.body.classList.contains("dark");
  themeButton.textContent = isDark ? "☀" : "☾";
  themeButton.setAttribute("aria-pressed", String(isDark));
}

themeButton.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "wattmetrica-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
  updateThemeButton();
});

try {
  if (localStorage.getItem("wattmetrica-theme") === "dark") {
    document.body.classList.add("dark");
  }
} catch (error) {
  // The calculator also works when local storage is unavailable.
}

updateThemeButton();

document.getElementById("year").textContent =
  new Date().getFullYear();

calculateElectricityCost();
