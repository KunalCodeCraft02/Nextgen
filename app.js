const express = require("express");
const app = express();
const mongoose = require("mongoose");

const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();
const db = require("./config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const School = require("./models/School")
const Student = require("./models/Student")

const validatePhoneNumber = (phone) => {
    if (!phone) return true;
    const phoneStr = String(phone).replace(/\D/g, '');
    return phoneStr.length === 10;
};

const validatePassword = (password) => {
    if (!password || password.length < 8) return false;
    return true;
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/characters', express.static(path.join(__dirname, 'public', 'characters')));
app.set("view engine", "ejs");
const auth = require("./middleware/auth");
console.log("ENV CHECK:");
console.log(process.env.MONGO_URL);


const helmet =
    require(
        "helmet"
    );

const compression =
    require(
        "compression"
    );



/* SECURITY */

/* SECURITY */
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);



/* RESPONSE COMPRESSION */

app.use(
    compression()
);

const rateLimit =
    require(
        "express-rate-limit"
    );



const signupLimiter =
    rateLimit({

        windowMs:
            15 * 60 * 1000,

        max: 20,

        message: {

            success: false,

            message:
                "Too many signup attempts. Try again after 15 minutes."

        },

        standardHeaders: true,

        legacyHeaders: false

    });



app.use(
    "/studentregister",
    signupLimiter
);

app.use(
    "/schoolregister",
    signupLimiter
);

app.use(
    cookieParser()
);


app.get("/", (req, res) => {
    res.render("index");
});

app.get(

    "/home",

    auth,

    async (req, res) => {

        const user =

            await Student.findById(
                req.user.id
            );

        const members =

            await Student.countDocuments({

                leaderEmail:
                    user.studentEmail,

                isMember: true

            });

        res.render(

            "home",

            {

                user,

                members

            }

        );

    });

app.get("/signinas", (req, res) => {
    res.render("signinas");
});

app.get("/schoolsignup", (req, res) => {
    res.render("schoolsignup");
});

app.get("/schoologin", (req, res) => {
    res.render("schoologin");
});

app.get("/studentsignup", (req, res) => {
    res.render("studentsignup");
});
app.get("/studentlogin", (req, res) => {
    res.render("studentlogin");
});
app.get("/verify-otp", (req, res) => {
    const type = req.query.type; // "student" or "school"

    const email =
        type === "student"
            ? req.cookies.pendingStudentEmail
            : req.cookies.pendingSchoolEmail;

    if (!email) {
        return res.redirect("/"); // session expired or invalid
    }

    res.render("verifyotp", { type, email });
});

app.get(

    "/team",

    auth,

    async (req, res) => {

        const user =

            await Student.findById(
                req.user.id
            );

        const members =

            await Student.find({

                leaderEmail:
                    user.studentEmail,

                isMember: true

            });

        res.render(

            "team",

            {
                members,
                user
            }

        );

    });

app.get(

    "/addmember",

    auth,

    async (req, res) => {

        const user =

            await Student.findById(
                req.user.id
            );

        res.render(

            "addmember",

            {
                user
            }

        );

    });






// POST REQURESTS 



app.post(
    "/schoolregister",

    async (req, res) => {

        try {

            const {

                officialEmail,
                phoneNumber,
                alternateNumber,
                website,
                schoolAddress,

                schoolName,
                schoolType,

                city,
                district,
                state,

                principalName,
                coordinatorName,

                teacherName,
                designation,

                teacherEmail,
                teacherPhone,

                password,
                confirmPassword

            } = req.body;



            /* PASSWORD CHECK */

            if (password !== confirmPassword) {

                return res.send(
                    "Passwords do not match"
                );

            }

            if (!validatePassword(password)) {
                return res.send(
                    "Password must be at least 8 characters"
                );
            }

            if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
                return res.send(
                    "Phone number must be exactly 10 digits"
                );
            }

            if (teacherPhone && !validatePhoneNumber(teacherPhone)) {
                return res.send(
                    "Teacher phone number must be exactly 10 digits"
                );
            }

            if (alternateNumber && !validatePhoneNumber(alternateNumber)) {
                return res.send(
                    "Alternate phone number must be exactly 10 digits"
                );
            }



            /* EXIST CHECK */

            const existingSchool =
                await School.findOne({

                    $or: [
                        {
                            officialEmail
                        },
                        {
                            teacherEmail
                        }
                    ]

                });

            if (existingSchool) {

                return res.send(
                    "School already exists"
                );

            }



            /* HASH PASSWORD */

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );



            /* CREATE SCHOOL */

            const school =
                await School.create({

                    officialEmail,

                    phoneNumber,

                    alternateNumber,

                    website,

                    schoolAddress,

                    schoolName,

                    schoolType,

                    city,

                    district,

                    state,

                    principalName,

                    coordinatorName,

                    teacherName,

                    designation,

                    teacherEmail,

                    teacherPhone,

                    password:
                        hashedPassword

                });

            console.log(school)
            // After School.create(...)

            /* GENERATE OTP */
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

            school.otp = otp;
            school.otpExpires = otpExpires;
            await school.save();

            /* SEND OTP EMAIL */
            await resend.emails.send({
                from: 'NextGen Innovators <noreply@bemybot.in>', // change to your verified domain
                to: officialEmail,
                subject: 'Verify Your School Email - NextGen Innovators',
                html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">School Email Verification</h2>
            <p>Hi ${teacherName},</p>
            <p>Your OTP for <strong>${schoolName}</strong> registration is:</p>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="color: #e94560; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <p>If you did not register, please ignore this email.</p>
        </div>
    `
            });

            /* STORE PENDING SESSION */
            res.cookie("pendingSchoolEmail", officialEmail, {
                httpOnly: true,
                maxAge: 10 * 60 * 1000
            });

            return res.redirect("/verify-otp?type=school");





            /* REDIRECT */

            return res.redirect(
                "/home"
            );



        } catch (err) {

            console.log(err);

            return res.status(500).send(
                "Server Error"
            );

        }

    }
);
app.post("/verify-otp", async (req, res) => {
    try {
        const { otp, type } = req.body;

        const email =
            type === "student"
                ? req.cookies.pendingStudentEmail
                : req.cookies.pendingSchoolEmail;

        if (!email) {
            return res.send("Session expired. Please register again.");
        }

        if (type === "student") {

            const student = await Student.findOne({ studentEmail: email });

            if (!student) return res.send("Student not found.");

            if (student.otp !== otp) {
                return res.render("verifyotp", {
                    type,
                    email,
                    error: "Invalid OTP. Please try again."
                });
            }

            if (student.otpExpires < new Date()) {
                return res.render("verifyotp", {
                    type,
                    email,
                    error: "OTP has expired. Please request a new one."
                });
            }

            /* CLEAR OTP + ACTIVATE */
            student.otp = null;
            student.otpExpires = null;
            student.studentStatus = "Active";
            await student.save();

            /* CLEAR PENDING COOKIE */
            res.clearCookie("pendingStudentEmail");

            /* ISSUE JWT */
            const token = jwt.sign(
                {
                    id: student._id,
                    email: student.studentEmail,
                    name: student.firstName
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.cookie("studentToken", token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.redirect("/home");

        } else if (type === "school") {

            const school = await School.findOne({ officialEmail: email });

            if (!school) return res.send("School not found.");

            if (school.otp !== otp) {
                return res.render("verifyotp", {
                    type,
                    email,
                    error: "Invalid OTP. Please try again."
                });
            }

            if (school.otpExpires < new Date()) {
                return res.render("verifyotp", {
                    type,
                    email,
                    error: "OTP has expired. Please request a new one."
                });
            }

            /* CLEAR OTP + ACTIVATE */
            school.otp = null;
            school.otpExpires = null;
            school.status = "Active";
            await school.save();

            /* CLEAR PENDING COOKIE */
            res.clearCookie("pendingSchoolEmail");

            /* ISSUE JWT */
            const token = jwt.sign(
                {
                    id: school._id,
                    email: school.officialEmail,
                    schoolName: school.schoolName
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.cookie("schoolToken", token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.redirect("/home");
        }

        return res.send("Invalid request.");

    } catch (err) {
        console.log(err);
        return res.status(500).send("Server Error");
    }
});


app.post("/resend-otp", async (req, res) => {
    try {
        const { type } = req.body;

        const email =
            type === "student"
                ? req.cookies.pendingStudentEmail
                : req.cookies.pendingSchoolEmail;

        if (!email) {
            return res.json({ success: false, message: "Session expired. Please register again." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        if (type === "student") {

            const student = await Student.findOne({ studentEmail: email });
            if (!student) return res.json({ success: false, message: "Student not found." });

            student.otp = otp;
            student.otpExpires = otpExpires;
            await student.save();

            await resend.emails.send({
                from: 'NextGen Innovators <noreply@bemybot.in>',
                to: email,
                subject: 'Your New OTP - NextGen Innovators',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                        <h2>New OTP Request</h2>
                        <p>Your new OTP is:</p>
                        <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px;">
                            <h1 style="color: #e94560; letter-spacing: 8px; margin: 0;">${otp}</h1>
                        </div>
                        <p>Valid for <strong>10 minutes</strong>.</p>
                    </div>
                `
            });

        } else {

            const school = await School.findOne({ officialEmail: email });
            if (!school) return res.json({ success: false, message: "School not found." });

            school.otp = otp;
            school.otpExpires = otpExpires;
            await school.save();

            await resend.emails.send({
                from: 'NextGen Innovators <noreply@bemybot.in>',
                to: email,
                subject: 'Your New OTP - NextGen Innovators',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                        <h2>New OTP Request</h2>
                        <p>Your new OTP is:</p>
                        <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px;">
                            <h1 style="color: #e94560; letter-spacing: 8px; margin: 0;">${otp}</h1>
                        </div>
                        <p>Valid for <strong>10 minutes</strong>.</p>
                    </div>
                `
            });
        }

        return res.json({ success: true, message: "OTP resent successfully." });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});



app.post(
    "/schoollogin",

    async (req, res) => {

        try {

            const {

                email,
                password

            } = req.body;



            /* CHECK SCHOOL */

            const school =
                await School.findOne({

                    officialEmail: email

                });

            if (!school) {

                return res.send(
                    "School not found"
                );

            }



            /* CHECK PASSWORD */

            const match =
                await bcrypt.compare(

                    password,

                    school.password

                );

            if (!match) {

                return res.send(
                    "Invalid password"
                );

            }



            /* CREATE JWT */

            const token =
                jwt.sign(

                    {

                        id:
                            school._id,

                        email:
                            school.officialEmail,

                        schoolName:
                            school.schoolName

                    },

                    process.env.JWT_SECRET,

                    {

                        expiresIn:
                            "7d"

                    }

                );



            /* SAVE COOKIE */

            res.cookie(

                "schoolToken",

                token,

                {

                    httpOnly: true,

                    maxAge:
                        7 * 24 * 60 * 60 * 1000

                }

            );



            /* REDIRECT */

            return res.redirect(
                "/home"
            );



        } catch (err) {

            console.log(err);

            return res.status(500).send(
                "Server Error"
            );

        }

    }
);









app.post(
    "/studentregister",

    async (req, res) => {

        try {

            const {

                firstName,
                middleName,
                lastName,

                dob,
                gender,
                bloodGroup,

                studentEmail,
                studentPhone,

                schoolName,


                currentClass,
                division,
                rollNumber,

                city,
                state,

                parentName,
                relationType,



                interestArea,
                motivation,

                password,
                confirmPassword

            } = req.body;



            /* PASSWORD CHECK */

            if (password !== confirmPassword) {

                return res.send(
                    "Passwords do not match"
                );

            }

            if (!validatePassword(password)) {
                return res.send(
                    "Password must be at least 8 characters"
                );
            }

            if (studentPhone && !validatePhoneNumber(studentPhone)) {
                return res.send(
                    "Student phone number must be exactly 10 digits"
                );
            }



            /* CHECK STUDENT */
            const normalizedStudentEmail = studentEmail.toLowerCase().trim();

            const existingStudent =
                await Student.findOne({

                    studentEmail: normalizedStudentEmail

                });

            if (existingStudent) {

                return res.send(
                    "Student already exists"
                );

            }



            /* HASH PASSWORD */

            const hashedPassword =
                await bcrypt.hash(

                    password,

                    10

                );



            /* CREATE STUDENT */

            const student =
                await Student.create({

                    firstName,

                    middleName,

                    lastName,

                    dob,

                    gender,

                    bloodGroup,

                    studentEmail,

                    studentPhone,

                    schoolName,

                    currentClass,

                    division,

                    rollNumber,

                    city,

                    state,

                    interestArea,

                    motivation,

                    password:
                        hashedPassword,

                    isLeader: true,

                    leaderEmail:
                        studentEmail

                });

            console.log(student)
            // After Student.create(...)

            /* GENERATE OTP */
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            student.otp = otp;
            student.otpExpires = otpExpires;
            await student.save();

            /* SEND OTP EMAIL */
            await resend.emails.send({
                from: 'NextGen Innovators <noreply@bemybot.in>', // change to your verified domain
                to: studentEmail,
                subject: 'Verify Your Email - NextGen Innovators',
                html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Email Verification</h2>
            <p>Hi ${firstName},</p>
            <p>Your OTP for NextGen Innovators registration is:</p>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="color: #e94560; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <p>If you did not register, please ignore this email.</p>
        </div>
    `
            });

            /* STORE PENDING SESSION */
            res.cookie("pendingStudentEmail", studentEmail, {
                httpOnly: true,
                maxAge: 10 * 60 * 1000 // 10 minutes
            });

            return res.redirect("/verify-otp?type=student");





            /* REDIRECT */

            return res.redirect(
                "/home"
            );



        } catch (err) {

            console.log(err);

            return res.status(500).send(
                "Server Error"
            );

        }

    }
);








app.post(
    "/studentlogin",

    async (req, res) => {

        try {

            const { studentEmail, password } = req.body;
            const student = await Student.findOne({ studentEmail });

            if (!student) {

                return res.send(
                    "Student not found"
                );

            }



            /* CHECK PASSWORD */

            const match =
                await bcrypt.compare(

                    password,

                    student.password

                );

            if (!match) {

                return res.send(
                    "Invalid Password"
                );

            }



            /* JWT TOKEN */

            const token =
                jwt.sign(

                    {

                        id:
                            student._id,

                        email:
                            student.studentEmail,

                        name:
                            student.firstName

                    },

                    process.env.JWT_SECRET,

                    {

                        expiresIn:
                            "7d"

                    }

                );



            /* COOKIE */

            res.cookie(

                "studentToken",

                token,

                {

                    httpOnly: true,

                    maxAge:
                        7 * 24 * 60 * 60 * 1000

                }

            );



            /* REDIRECT */

            return res.redirect(
                "/home"
            );



        } catch (err) {

            console.log(err);

            return res.status(500).send(
                "Server Error"
            );

        }

    }
);







app.post(
    "/addmember",
    auth,
    async (req, res) => {
        try {
            const {
                leaderEmail,
                name,
                studentEmail,
                role
            } = req.body;
            // Prevent leader from adding themselves as a member
            if (leaderEmail === studentEmail) {
                return res.json({
                    success: false,
                    message: "You cannot add yourself as a member"
                });
            }
            const normalizedStudentEmail = studentEmail.toLowerCase().trim();
            let student =
                await Student.findOne({
                    studentEmail: normalizedStudentEmail
                });
            // If student doesn't exist, create a new one with minimal info
            if (!student) {
                // Generate placeholder values for required fields
                const nameParts = name.trim().split(' ');
                const placeholderFirstName = nameParts[0] || 'Student';
                const placeholderLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Member';

                student = await Student.create({
                    firstName: placeholderFirstName,
                    lastName: placeholderLastName,
                    dob: new Date('2000-01-01'), // Placeholder DOB
                    gender: 'Other', // Placeholder gender
                    studentEmail: normalizedStudentEmail,
                    studentPhone: '0000000000', // Placeholder phone
                    schoolName: 'Unknown School', // Placeholder school
                    currentClass: 'Unknown', // Placeholder class
                    division: '',
                    rollNumber: '',
                    city: 'Unknown', // Placeholder city
                    state: 'Unknown', // Placeholder state
                    password: await bcrypt.hash('TempPass123!', 10), // Placeholder password
                    name: name
                });
            }
            // Find the leader
            const leader =
                await Student.findOne({
                    studentEmail: leaderEmail
                });
            if (!leader) {
                return res.json({
                    success: false,
                    message: "Leader not found"
                });
            }
            student.isMember = true;
            student.memberRole = role;
            student.leaderEmail = leaderEmail;
            student.name = name;
            student.joinedAsMemberAt = new Date();
            // Add the student to the leader's members list
            leader.members.push(studentEmail);
            await student.save();
            await leader.save();
            return res.json({
                success: true
            });
        }
        catch (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    });




app.get(

    "/logout",

    (req, res) => {

        try {

            /* REMOVE TOKENS */

            res.clearCookie(
                "studentToken"
            );

            res.clearCookie(
                "schoolToken"
            );



            /* REDIRECT */

            return res.redirect(
                "/"
            );

        } catch (err) {

            console.log(err);

            return res.status(500)
                .send(
                    "Logout Error"
                );

        }

    }
);



app.listen("3000", () => {
    console.log("server running on 127.0.0.1:3000")
})