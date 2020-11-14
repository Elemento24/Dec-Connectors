const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @router    POST api/users
// @desc      Register User
// @access    Public
router.post(
  '/',
  [
    check('name', 'Name is Required!').not().isEmpty(),
    check('email', 'Please include a valid email!').isEmail(),
    check('password', 'Please enter a password with 6 or more Characters!').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    try {
      // See if User Exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          errors: [{ msg: 'User already exists!' }]
        });
      }

      // Get User's Gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      // Create an instance of the User
      user = new User({
        name, email, avatar, password
      });

      // Encrypt Password using bcrypt
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Saving the Instance of the User 
      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      };
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token })
        }
      );

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }

  }
);

module.exports = router;