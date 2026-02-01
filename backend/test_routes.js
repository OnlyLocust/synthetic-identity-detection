const axios = require('axios');

async function testRoutes() {
    try {
        console.log("Testing Health...");
        const health = await axios.get('http://localhost:3001/api/health');
        console.log("Health:", health.status, health.data);

        console.log("Testing KYC Start...");
        const start = await axios.post('http://localhost:3001/api/kyc/start');
        console.log("KYC Start:", start.status, start.data);

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) console.error("Data:", error.response.status, error.response.data);
    }
}

testRoutes();
