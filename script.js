
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

function formatMoney(amount, currency) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
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
            "Please enter valid values. Hours per day must be between 0 and 24.";
        errorElement.hidden = false;
        clearResults();
        return;
    }

    const dailyKwh = (power * hours) / 1000;
    const dailyCost = dailyKwh * price;
    const monthlyCost = dailyCost * 30;
    const yearlyCost = dailyCost * 365;

    const results = [
        dailyKwh,
        dailyCost,
        monthlyCost,
        yearlyCost
    ];

    if (!results.every(Number.isFinite)) {
        errorElement.textContent =
            "The entered values are too large. Please use smaller numbers.";
        errorElement.hidden = false;
        clearResults();
        return;
    }

    errorElement.hidden = true;

    dailyCostElement.textContent =
        formatMoney(dailyCost, currency);

    monthlyCostElement.textContent =
        formatMoney(monthlyCost, currency);

    yearlyCostElement.textContent =
        formatMoney(yearlyCost, currency);

    dailyKwhElement.textContent =
        dailyKwh.toFixed(2) + " kWh";
}

const inputs = [
    powerInput,
    hoursInput,
    priceInput,
    currencyInput
];

inputs.forEach(function(input) {
    input.addEventListener("input", calculateElectricityCost);
    input.addEventListener("change", calculateElectricityCost);
});

document.getElementById("year").textContent =
    new Date().getFullYear();

calculateElectricityCost();
