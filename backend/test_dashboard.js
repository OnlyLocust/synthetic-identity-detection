const axios = require('axios');

async function testDashboard() {
    try {
        console.log("Testing Dashboard Stats...");
        const stats = await axios.get('http://localhost:3001/api/dashboard/stats');
        console.log("Stats:", stats.data);

        console.log("Testing Recent...");
        const recent = await axios.get('http://localhost:3001/api/dashboard/recent');
        console.log("Recent:", recent.data);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

testDashboard();
