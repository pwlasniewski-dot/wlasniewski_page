const url = "https://wlasniewski.pl/api/assets-mini.php?kind=portfolio";

async function test() {
    try {
        console.log("Fetching", url);
        const res = await fetch(url);
        console.log("Status:", res.status);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        console.log("Categories found:", data.categories?.length);
        console.log("First category:", data.categories?.[0]?.slug);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
