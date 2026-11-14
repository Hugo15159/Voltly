
"use strict";

// WattMetrica - Account Navigation

const accountLink = document.getElementById("accountLink");

async function initializeAccount() {
    if (!accountLink) return;

    if (
        typeof supabase === "undefined" ||
        typeof SUPABASE_URL === "undefined" ||
        typeof SUPABASE_PUBLISHABLE_KEY === "undefined"
    ) {
        console.error("Supabase configuration is missing.");
        return;
    }

    try {
        const client = supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

        function updateAccountLink(user) {
            accountLink.textContent = user
                ? "My Account"
                : "Log In";
        }

        const { data, error } = await client.auth.getUser();

        if (error) {
            console.warn("Account check:", error.message);
        }

        updateAccountLink(data?.user || null);

        client.auth.onAuthStateChange((event, session) => {
            updateAccountLink(session?.user || null);
        });

    } catch (error) {
        console.error("Account initialization failed:", error);
    }
}

initializeAccount();
