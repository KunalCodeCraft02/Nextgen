const mongoose = require("mongoose");

const studentSchema =
    new mongoose.Schema({

        /* PERSONAL DETAILS */

        firstName: {
            type: String,
            required: true,
            trim: true
        },

        middleName: {
            type: String,
            trim: true,
            default: ""
        },

        lastName: {
            type: String,
            required: true,
            trim: true
        },

        dob: {
            type: Date,
            required: true
        },

        gender: {
            type: String,

            enum: [
                "Male",
                "Female",
                "Other"
            ],

            required: true
        },

        bloodGroup: {
            type: String,

            enum: [
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-"
            ]
        },



        /* CONTACT */

        studentEmail: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        studentPhone: {
            type: String,
            required: true
        },



        /* SCHOOL DETAILS */

        schoolName: {
            type: String,
            required: true
        },

       
        currentClass: {
            type: String,
            required: true
        },

        division: {
            type: String,
            default: ""
        },

        rollNumber: {
            type: String,
            default: ""
        },

        city: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true
        },



        /* PARENT DETAILS */

       




        /* INTEREST */

        interestArea: {
            type: String,
            default: ""
        },

        motivation: {
            type: String,
            default: ""
        },



        /* LOGIN */

        password: {
            type: String,
            required: true
        },



        /* ACCOUNT */

        studentStatus: {
            type: String,

            enum: [
                "Active",
                "Blocked",
                "Pending"
            ],

            default: "Active"
        },

        rememberMe: {
            type: Boolean,
            default: false
        },

        lastLogin: {
            type: Date
        },



        /* SYSTEM */

        createdAt: {
            type: Date,
            default: Date.now
        },

        updatedAt: {
            type: Date,
            default: Date.now
        }

    });

module.exports =
    mongoose.model(
        "Student",
        studentSchema
    );