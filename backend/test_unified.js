const axios = require('axios');

async function testUnified() {
    try {
        console.log("Testing Unified Endpoint...");
        const response = await axios.post('http://localhost:3001/api/unified', {
            record: {
                name: "John Doe",
                email: "john.doe@example.com",
                phone: "1234567890",
                dob: "1990-01-01",
                faceAge: 30,
                ip: "127.0.0.1",
                userId: "test_user_1",
                formTime: 5000
            },
            behavior: {
                events: [
                    { type: 'keydown', timestamp: 1000, fieldId: 'name' },
                    { type: 'keydown', timestamp: 1100, fieldId: 'name' }, // 100ms
                    { type: 'keydown', timestamp: 1200, fieldId: 'name' }, // 100ms
                    { type: 'mousemove', x: 0, y: 0, timestamp: 1500 },
                    { type: 'mousemove', x: 100, y: 100, timestamp: 2000 }
                ]
            },
            biometric: {
                visualAge: 30,
                livenessVerified: true
            }
        });

        console.log("Response:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) console.error("Data:", error.response.data);
    }
}

testUnified();
