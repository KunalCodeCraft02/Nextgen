const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    role: {
        type: String,
        required: true,
        enum: [
            "innovator",
            "leader",
            "creative",
            "marketing"
        ]
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Member", memberSchema);