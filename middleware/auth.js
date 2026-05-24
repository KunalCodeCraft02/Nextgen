const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {

    try {

        /* GET TOKEN */

        const token =
            req.cookies.studentToken
            ||
            req.cookies.schoolToken;



        if (!token) {

            return res.redirect(
                "/"
            );

        }



        /* VERIFY */

        const decoded =
            jwt.verify(

                token,

                process.env.JWT_SECRET

            );



        /* SAVE USER */

        req.user = decoded;



        next();

    } catch (err) {

        console.log(err);

        /* INVALID TOKEN */

        return res.redirect(
            "/"
        );

    }

};

module.exports = auth;