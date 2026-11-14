
"use strict";

// WattMetrica - Authentication

const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordGroup = document.getElementById("passwordGroup");

const formTitle = document.getElementById("formTitle");
const formDescription = document.getElementById("formDescription");
const submitButton = document.getElementById("submitButton");
const switchModeButton = document.getElementById("switchMode");
const forgotPasswordButton = document.getElementById("forgotPassword");
const authMessage = document.getElementById("authMessage");

let mode = "login";
let busy = false;
let client = null;
let currentUser = null;

function showMessage(message, type = "error") {
  authMessage.textContent = message;
  authMessage.className = "auth-message " + type;
  authMessage.hidden = false;
}

function clearMessage() {
  authMessage.textContent = "";
  authMessage.hidden = true;
}

function setBusy(value) {
  busy = value;
  submitButton.disabled = value;
  switchModeButton.disabled = value;
  forgotPasswordButton.disabled = value;
}

function setMode(newMode) {
  mode = newMode;
  clearMessage();
  passwordInput.value = "";

  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.remove();
  }

  authForm.hidden = false;
  switchModeButton.hidden = false;

  if (mode === "signup") {
    formTitle.textContent = "Create your account";
    formDescription.textContent =
      "Join WattMetrica to manage your energy calculations.";

    submitButton.textContent = "Sign Up";
    switchModeButton.textContent =
      "Already have an account? Log In";

    forgotPasswordButton.hidden = true;
    passwordGroup.hidden = false;

    passwordInput.required = true;
    passwordInput.minLength = 8;
    passwordInput.autocomplete = "new-password";

  } else if (mode === "forgot") {
    formTitle.textContent = "Reset your password";
    formDescription.textContent =
      "Enter your email address to receive a reset link.";

    submitButton.textContent = "Send reset link";
    switchModeButton.textContent = "Back to Log In";

    forgotPasswordButton.hidden = true;
    passwordGroup.hidden = true;
    passwordInput.required = false;

  } else if (mode === "recovery") {
    formTitle.textContent = "Choose a new password";
    formDescription.textContent =
      "Enter your new password below.";

    submitButton.textContent = "Update password";
    switchModeButton.textContent = "Back to Log In";

    forgotPasswordButton.hidden = true;
    passwordGroup.hidden = false;

    passwordInput.required = true;
    passwordInput.minLength = 8;
    passwordInput.autocomplete = "new-password";

  } else {
    formTitle.textContent = "Welcome back";
    formDescription.textContent =
      "Sign in to your WattMetrica account.";

    submitButton.textContent = "Log In";
    switchModeButton.textContent =
      "Don't have an account? Sign Up";

    forgotPasswordButton.hidden = false;
    passwordGroup.hidden = false;

    passwordInput.required = true;
    passwordInput.minLength = 6;
    passwordInput.autocomplete = "current-password";
  }
}

function showSignedIn(user) {
  if (!user) return;

  currentUser = user;
  clearMessage();

  formTitle.textContent = "My Account";
  formDescription.textContent =
    "Signed in as " + (user.email || "WattMetrica user");

  authForm.hidden = true;
  switchModeButton.hidden = true;
  forgotPasswordButton.hidden = true;

  let logoutButton = document.getElementById("logoutButton");

  if (!logoutButton) {
    logoutButton = document.createElement("button");
    logoutButton.id = "logoutButton";
    logoutButton.type = "button";
    logoutButton.className = "auth-submit";
    logoutButton.textContent = "Log Out";

    document.querySelector(".auth-card")
      .appendChild(logoutButton);
  }

  logoutButton.onclick = async function () {
    logoutButton.disabled = true;

    const { error } = await client.auth.signOut();

    if (error) {
      showMessage(error.message);
      logoutButton.disabled = false;
      return;
    }

    currentUser = null;
    setMode("login");
  };
}

async function initializeAuth() {
  if (
    typeof supabase === "undefined" ||
    typeof SUPABASE_URL === "undefined" ||
    typeof SUPABASE_PUBLISHABLE_KEY === "undefined" ||
    SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")
  ) {
    showMessage(
      "Supabase configuration is missing. Check supabase-config.js."
    );
    submitButton.disabled = true;
    return;
  }

  try {
    client = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("recovery");
      } else if (event === "SIGNED_OUT") {
        currentUser = null;
        setMode("login");
      } else if (event === "SIGNED_IN" && mode !== "recovery") {
        if (session && session.user) {
          showSignedIn(session.user);
        }
      }
    });

    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    if (data.session && data.session.user) {
      showSignedIn(data.session.user);
    }

  } catch (error) {
    showMessage(
      error.message || "Could not connect to Supabase."
    );
  }
}

authForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (busy || !client) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  clearMessage();
  setBusy(true);

  try {
    if (mode === "signup") {
      if (password.length < 8) {
        showMessage("Password must contain at least 8 characters.");
        return;
      }

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            new URL("auth.html", window.location.href).href
        }
      });

      if (error) throw error;

      if (data.session && data.user) {
        showSignedIn(data.user);
      } else {
        showMessage(
          "Check your email to confirm your account.",
          "success"
        );
      }

    } else if (mode === "forgot") {
      const { error } =
        await client.auth.resetPasswordForEmail(email, {
          redirectTo:
            new URL("auth.html", window.location.href).href
        });

      if (error) throw error;

      showMessage(
        "If this account exists, a password reset email will be sent.",
        "success"
      );

    } else if (mode === "recovery") {
      if (password.length < 8) {
        showMessage("Use at least 8 characters.");
        return;
      }

      const { error } = await client.auth.updateUser({
        password
      });

      if (error) throw error;

      showMessage(
        "Password updated successfully. You can now sign in.",
        "success"
      );

      await client.auth.signOut();
      setMode("login");

      showMessage(
        "Password updated. Please log in with your new password.",
        "success"
      );

    } else {
      const { data, error } =
        await client.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      showSignedIn(data.user);
    }

  } catch (error) {
    showMessage(
      error.message || "Something went wrong."
    );
  } finally {
    setBusy(false);
  }
});

switchModeButton.addEventListener("click", function () {
  if (mode === "login") {
    setMode("signup");
  } else {
    setMode("login");
  }
});

forgotPasswordButton.addEventListener("click", function () {
  setMode("forgot");
});

setMode("login");
initializeAuth();
