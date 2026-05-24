const mongoose = require("mongoose");

const schoolSchema =
    new mongoose.Schema({

        officialEmail: {
            type: String,
            required: true,
            unique: true
        },

        phoneNumber: {
            type: String,
            required: true
        },

        alternateNumber: String,

        website: String,

        schoolAddress: {
            type: String,
            required: true
        },

        schoolName: {
            type: String,
            required: true
        },

        schoolType: {
            type: String,
            required: true
        },

        city: {
            type: String,
            required: true
        },

        district: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true
        },

        principalName: {
            type: String,
            required: true
        },

        coordinatorName: {
            type: String,
            required: true
        },

        teacherName: {
            type: String,
            required: true
        },

        designation: {
            type: String,
            required: true
        },

        teacherEmail: {
            type: String,
            required: true
        },

        teacherPhone: {
            type: String,
            required: true
        },

        password: {
            type: String,
            required: true
        },

        status: {
            type: String,
            default: "Pending"
        },

        createdAt: {
            type: Date,
            default: Date.now
        }

    });

module.exports =
    mongoose.model(
        "School",
        schoolSchema
    );