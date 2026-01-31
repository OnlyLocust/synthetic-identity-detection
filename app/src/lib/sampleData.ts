import type { IdentityRecord } from '@/types';

export const sampleRecords: IdentityRecord[] = [
  // Normal record - clean
  {
    name: "John Smith",
    dob: "1995-03-15",
    email: "john.smith@email.com",
    phone: "+1-555-0101",
    faceAge: 29,
    deviceId: "device_abc123",
    ip: "192.168.1.100",
    formTime: 8500,
    userId: "user_001"
  },
  // Age mismatch - synthetic
  {
    name: "Sarah Johnson",
    dob: "1980-07-22",
    email: "sarah.j@email.com",
    phone: "+1-555-0102",
    faceAge: 25,
    deviceId: "device_def456",
    ip: "192.168.1.101",
    formTime: 9200,
    userId: "user_002"
  },
  // Fast form completion - bot suspected
  {
    name: "Mike Brown",
    dob: "1988-11-08",
    email: "mike.brown@email.com",
    phone: "+1-555-0103",
    faceAge: 36,
    deviceId: "device_ghi789",
    ip: "192.168.1.102",
    formTime: 800, // Less than 2 seconds
    userId: "user_003"
  },
  // Identity clustering - same email across users
  {
    name: "Emma Wilson",
    dob: "1992-05-30",
    email: "shared.account@email.com",
    phone: "+1-555-0104",
    faceAge: 32,
    deviceId: "device_jkl012",
    ip: "192.168.1.103",
    formTime: 10500,
    userId: "user_004"
  },
  {
    name: "David Lee",
    dob: "1985-12-10",
    email: "shared.account@email.com", // Same email as user_004
    phone: "+1-555-0105",
    faceAge: 39,
    deviceId: "device_mno345",
    ip: "192.168.1.104",
    formTime: 7800,
    userId: "user_005"
  },
  // Network fingerprint conflict - same IP and device
  {
    name: "Lisa Chen",
    dob: "1990-09-18",
    email: "lisa.chen@email.com",
    phone: "+1-555-0106",
    faceAge: 34,
    deviceId: "device_shared_001",
    ip: "10.0.0.50",
    formTime: 6500,
    userId: "user_006"
  },
  {
    name: "Robert Taylor",
    dob: "1978-04-05",
    email: "robert.t@email.com",
    phone: "+1-555-0107",
    faceAge: 46,
    deviceId: "device_shared_001", // Same device
    ip: "10.0.0.50", // Same IP
    formTime: 7200,
    userId: "user_007"
  },
  // Multiple issues - critical synthetic
  {
    name: "Alex Morgan",
    dob: "2000-01-01",
    email: "alex.m@email.com",
    phone: "+1-555-0108",
    faceAge: 45, // Age mismatch
    deviceId: "device_bot_001",
    ip: "10.0.0.99",
    formTime: 500, // Bot suspected
    userId: "user_008"
  },
  // Another clean record
  {
    name: "Jennifer White",
    dob: "1987-06-25",
    email: "jen.white@email.com",
    phone: "+1-555-0109",
    faceAge: 37,
    deviceId: "device_pqr678",
    ip: "192.168.1.105",
    formTime: 11200,
    userId: "user_009"
  },
  // Phone clustering
  {
    name: "Chris Anderson",
    dob: "1993-08-14",
    email: "chris.a@email.com",
    phone: "+1-555-9999", // Shared phone
    faceAge: 31,
    deviceId: "device_stu901",
    ip: "192.168.1.106",
    formTime: 8900,
    userId: "user_010"
  },
  {
    name: "Patricia Moore",
    dob: "1975-11-03",
    email: "pat.moore@email.com",
    phone: "+1-555-9999", // Same phone as user_010
    faceAge: 49,
    deviceId: "device_vwx234",
    ip: "192.168.1.107",
    formTime: 9500,
    userId: "user_011"
  }
];

export const generateJsonTemplate = (): string => {
  const template = {
    records: [
      {
        name: "string",
        dob: "YYYY-MM-DD",
        email: "string",
        phone: "string",
        faceAge: "number",
        deviceId: "string",
        ip: "string",
        formTime: "number (milliseconds)",
        userId: "string"
      }
    ]
  };
  return JSON.stringify(template, null, 2);
};
