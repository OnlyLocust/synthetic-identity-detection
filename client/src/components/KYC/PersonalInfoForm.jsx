import { useState, useEffect } from 'react';
import { Button, Input, Select } from '../Common';
import { formatPhone } from '../../utils/helpers';

// Indian States
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
];

const PersonalInfoForm = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        fatherName: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        phone: '',
        panNumber: '',
        aadhaarNumber: '',
        address: '',
        city: '',
        state: '',
        pinCode: '',
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        // Format phone number
        if (name === 'phone') {
            formattedValue = value.replace(/\D/g, '').slice(0, 10);
        }

        // Format PAN (uppercase, alphanumeric)
        if (name === 'panNumber') {
            formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        }

        // Format Aadhaar (only numbers)
        if (name === 'aadhaarNumber') {
            formattedValue = value.replace(/\D/g, '').slice(0, 12);
        }

        // Format PIN code
        if (name === 'pinCode') {
            formattedValue = value.replace(/\D/g, '').slice(0, 6);
        }

        setFormData({ ...formData, [name]: formattedValue });

        // Clear error when user types
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    const validatePAN = (pan) => {
        // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    };

    const validateAadhaar = (aadhaar) => {
        return aadhaar.length === 12 && /^\d+$/.test(aadhaar);
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 3) {
            newErrors.fullName = 'Name must be at least 3 characters';
        }

        if (!formData.fatherName.trim()) {
            newErrors.fatherName = "Father's name is required";
        }

        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = 'Date of birth is required';
        } else {
            const age = Math.floor((new Date() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
            if (age < 18) {
                newErrors.dateOfBirth = 'You must be at least 18 years old';
            }
        }

        if (!formData.gender) {
            newErrors.gender = 'Please select your gender';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.phone) {
            newErrors.phone = 'Phone number is required';
        } else if (formData.phone.length !== 10) {
            newErrors.phone = 'Phone number must be 10 digits';
        }

        if (!formData.panNumber) {
            newErrors.panNumber = 'PAN number is required';
        } else if (!validatePAN(formData.panNumber)) {
            newErrors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
        }

        if (!formData.aadhaarNumber) {
            newErrors.aadhaarNumber = 'Aadhaar number is required';
        } else if (!validateAadhaar(formData.aadhaarNumber)) {
            newErrors.aadhaarNumber = 'Aadhaar must be 12 digits';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!formData.state) {
            newErrors.state = 'State is required';
        }

        if (!formData.pinCode) {
            newErrors.pinCode = 'PIN code is required';
        } else if (formData.pinCode.length !== 6) {
            newErrors.pinCode = 'PIN code must be 6 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({
                ...formData,
                country: 'India',
            });
        }
    };

    // Format Aadhaar for display (XXXX XXXX XXXX)
    const formatAadhaarDisplay = (value) => {
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/(\d{0,4})(\d{0,4})(\d{0,4})/);
        if (match) {
            return [match[1], match[2], match[3]].filter(Boolean).join(' ');
        }
        return value;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Details Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 text-sm font-bold">1</span>
                    Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Full Name (as per PAN)"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        error={errors.fullName}
                        required
                    />
                    <Input
                        label="Father's Name"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                        placeholder="Enter father's name"
                        error={errors.fatherName}
                        required
                    />
                    <Input
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        error={errors.dateOfBirth}
                        required
                    />
                    <Select
                        label="Gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        options={GENDER_OPTIONS}
                        placeholder="Select gender"
                        error={errors.gender}
                        required
                    />
                </div>
            </div>

            {/* Identity Documents Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 text-sm font-bold">2</span>
                    Identity Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="PAN Number"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        error={errors.panNumber}
                        maxLength={10}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aadhaar Number <span className="text-danger-500">*</span>
                        </label>
                        <input
                            name="aadhaarNumber"
                            value={formatAadhaarDisplay(formData.aadhaarNumber)}
                            onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12);
                                setFormData({ ...formData, aadhaarNumber: cleaned });
                                if (errors.aadhaarNumber) {
                                    setErrors({ ...errors, aadhaarNumber: null });
                                }
                            }}
                            placeholder="XXXX XXXX XXXX"
                            maxLength={14}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.aadhaarNumber ? 'border-danger-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.aadhaarNumber && (
                            <p className="mt-1 text-sm text-danger-500">{errors.aadhaarNumber}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Contact Details Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 text-sm font-bold">3</span>
                    Contact Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        error={errors.email}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mobile Number <span className="text-danger-500">*</span>
                        </label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-lg text-sm">
                                +91
                            </span>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="9876543210"
                                maxLength={10}
                                className={`flex-1 px-4 py-2.5 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.phone ? 'border-danger-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>
                        {errors.phone && (
                            <p className="mt-1 text-sm text-danger-500">{errors.phone}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Address Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 text-sm font-bold">4</span>
                    Address Details
                </h3>
                <div className="space-y-4">
                    <Input
                        label="Full Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="House No, Street, Locality"
                        error={errors.address}
                        required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="City/Town"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Enter city"
                            error={errors.city}
                            required
                        />
                        <Select
                            label="State"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            options={INDIAN_STATES.map(s => ({ value: s, label: s }))}
                            placeholder="Select state"
                            error={errors.state}
                            required
                        />
                        <Input
                            label="PIN Code"
                            name="pinCode"
                            value={formData.pinCode}
                            onChange={handleChange}
                            placeholder="6-digit PIN"
                            error={errors.pinCode}
                            maxLength={6}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <Button type="submit" loading={loading} size="lg">
                    Continue to Document Upload
                </Button>
            </div>
        </form>
    );
};

export default PersonalInfoForm;
