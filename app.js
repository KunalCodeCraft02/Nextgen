const express = require("express");
const app = express();
const mongoose = require("mongoose");

const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();
const db = require("./config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

app.get("/home", auth, (req, res) => {
    res.render("home");
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



            /* JWT TOKEN */

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
                        expiresIn: "7d"
                    }

                );



            /* STORE COOKIE */

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

            const existingStudent =
                await Student.findOne({

                    studentEmail

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
                        hashedPassword

                });

            console.log(student)



            /* JWT */

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