const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const nodemailer=require('nodemailer')
const app = express(); // Initialize express app
app.use(cors()); // Apply cors middleware after app initialization
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = 3000;

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/final_student_details')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

  const studentDetailsDb = mongoose.createConnection('mongodb://localhost:27017/student_details');

studentDetailsDb.on('error', err => console.error('MongoDB connection error for student_details:', err));
studentDetailsDb.once('open', () => console.log('MongoDB connected successfully for student_details'));


// Define Schema
const studentSchema = new mongoose.Schema({
  name: String,
  registerNumber: String,
  year: String,
  email: String,
  cgpa: Number,
  eventType: String,
  collegeName: String,
  startDate: Date,
  endDate: Date,
  file1: String,
  file2: String,
  description: String,
});

const Student = mongoose.model('Student', studentSchema);

const studentDetailsSchema = new mongoose.Schema({
  email: String,
  name: String,
});

const StudentDetails = studentDetailsDb.model('twentymembers', studentDetailsSchema);

// Middleware to serve static files
app.use(express.static(path.join(__dirname)));

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'gemini.html'));
});

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'aravinthsubbaiah3@gmail.com',
    pass:'mheu wpuw gzuz xiha'
  }
});

// Send Email Function
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: 'aravinthsubbaiah3@gmail.com',
      to: to,
      subject: subject,
      text: text
    });
    console.log('Email sent to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Handle form submissions
app.post('/register', async (req, res)  => {
  try {
    // Log the incoming data
    console.log('Received data:', req.body);

    // Extract form data
    const { name, registerNumber, year, email, cgpa, eventType, collegeName, startDate, endDate, file1, file2, description } = req.body;

    // Save to MongoDB
    const newStudent = new Student({
      name,
      registerNumber,
      year,
      email,
      cgpa,
      eventType,
      collegeName,
      startDate,
      endDate,
      file1,
      file2,
      description,
    });

    await newStudent.save();

    // Synchronize with mentor backend
    await axios.post('http://localhost:3001/syncStudent', {
      name,
      registerNumber,
      cgpa,
      startDate,
      endDate,
      collegeName,
      file1,
      file2,
      email
    });
    res.status(200).json({ message: 'Form submitted successfully!' });
    // res.redirect('/success.html');
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).send('Error submitting form.');
  }
});

app.post('/validateName', async (req, res) => {
  try {
    const { email, name } = req.body;
    console.log(`Received for validation - Email: ${email}, Name: ${name}`);
    
    // Normalize the name for comparison
    const formattedName = name.trim().toUpperCase();
    
    // Find student details by email
    const studentDetails = await StudentDetails.findOne({ email: email });

    if (studentDetails) {
      const storedName = studentDetails.name.trim().toUpperCase();
      console.log(`Stored name: ${storedName}`);
      const isValidName = storedName === formattedName;

      // Log database details
      console.log(`Validation result for email ${email}:`, {
        email,
        storedName,
        enteredName: formattedName,
        isValid: isValidName
      });

      res.json({ valid: isValidName });
    } else {
      console.log(`No student found for email: ${email}`);
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('Error validating name:', error);
    res.status(500).send('Error validating name.');
  }
});




// Retrieve student data for mentor.html
app.get('/getStudents', async (req, res) => {
  try {
    // Fetch students with only specific fields
    const students = await Student.find({}, 'name registerNumber cgpa startDate endDate collegeName file1 file2');
    console.log('Fetched students:', students); // Log data for debugging
    res.json(students); // Send the filtered data as JSON response
  } catch (error) {
    console.error('Error retrieving students:', error);
    res.status(500).send('Error retrieving students.');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
