const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Register a new instructor account
router.post('/register', async (req, res, next) => {
  try {
    const instructor = await prisma.instructor.create({
      data: {
        username: req.body.username,
        password: req.body.password,
      },
    });

    // Create a token with the instructor id
    const token = jwt.sign({ id: instructor.id }, process.env.JWT);

    res.status(201).send({ token });
  } catch (error) {
    next(error);
  }
});

// Login to an existing instructor account
router.post('/login', async (req, res, next) => {
  try {
    const instructor = await prisma.instructor.findFirst({
      where: {
        username: req.body.username,
        password: req.body.password,
      },
    });

    if (!instructor) {
      return res.status(401).send('Invalid login credentials.');
    }

    // Create a token with the instructor id
    const token = jwt.sign({ id: instructor.id }, process.env.JWT);

    res.send({ token });
  } catch (error) {
    next(error);
  }
});

// Get the currently logged in instructor
router.get('/me', async (req, res, next) => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: {
        id: req.user?.id,
      },
    });

    res.send(instructor);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
