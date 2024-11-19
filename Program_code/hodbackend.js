const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path=require('path')
const nodemailer=require('nodemailer')
const app = express();
const port = 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/hod')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Schema and Model
const studentSchema = new mongoose.Schema({
    name: String,
    registerNumber: String,
    startDate: Date,
    endDate: Date,
    collegeName: String,
    email:String,
    numberOfODTaken: { type: Number, default: 0 },
    status: { type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' }, // Class Incharge status
});

const Student = mongoose.model('finalapprovalbyhod', studentSchema);

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
      user: 'aravinthsubbaiah3@gmail.com', 
      pass: 'mheu wpuw gzuz xiha' 
  }
});

async function sendEmail(to, subject, text) {
  try {
      await transporter.sendMail({
          from: 'aravinthsubbaiah3@gmail.com', 
          to,
          subject,
          html:htmlContent
      });
      console.log(`Email sent to ${to}`);
  } catch (error) {
      console.error('Error sending email:', error);
  }
}

// Serve static files (e.g., HTML, CSS)
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'hod.html'));
});
// Fetch students with status 'approved' by the mentor and pending approval by the class incharge
app.get('/getAcceptedStudents', async (req, res) => {
    try {
        const students = await Student.find({ status: 'pending' });
        res.json(students);
    } catch (err) {
      res.status(500).send('Error fetching students');
    }
});

// Update student status based on class incharge's decision
app.post('/updateStudentStatus', async (req, res) => {
    const { id, status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).send('Invalid status');
    }

    try {
        const student = await Student.findByIdAndUpdate(id, { status }, { new: true });
        if (!student) {
            return res.status(404).send('Student not found');
        }

        if (status === 'approved') {
          // Increment OD count in mentor's database
          await axios.post('http://localhost:3001/updateODCount', {
              registerNumber: student.registerNumber
          });
      }
        // student.status = status;
        // await student.save();

        // Email sending logic
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'aravinthsubbaiah3@gmail.com',
              pass: 'mheu wpuw gzuz xiha'
          }
      });
      
      async function sendEmail(to, subject, htmlContent) {
          try {
              await transporter.sendMail({
                  from: 'aravinthsubbaiah3@gmail.com',
                  to,
                  subject,
                  html:htmlContent
              });
              console.log(`Email sent to ${to}`);
          } catch (error) {
              console.error('Error sending email:', error);
          }
      }      
      const emailText = status === 'approved'
    ? `<html>
        <body>
          <p style="font-size: 16px; line-height: 1.5;">
            The registration for on duty has been <strong>accepted</strong>. Here are the details:
          </p>
          <ul style="font-size: 16px; line-height: 1.5;">
            <li><strong>Name:</strong> ${student.name}</li>
            <li><strong>Register Number:</strong> ${student.registerNumber}</li>
            <li><strong>Event Start Date and Time:</strong> ${student.startDate.toLocaleString()}</li>
            <li><strong>Event End Date and Time:</strong> ${student.endDate.toLocaleString()}</li>
          </ul>
        </body>
      </html>`
    : `<html>
        <body>
          <p style="font-size: 16px; line-height: 1.5;">
            The registration for on duty request has been <strong>rejected</strong>. Here are the details:
          </p>
          <ul style="font-size: 16px; line-height: 1.5;">
            <li><strong>Name:</strong> ${student.name}</li>
            <li><strong>Register Number:</strong> ${student.registerNumber}</li>
            <li><strong>Event Start Date and Time:</strong> ${student.startDate.toLocaleString()}</li>
            <li><strong>Event End Date and Time:</strong> ${student.endDate.toLocaleString()}</li>
          </ul>
        </body>
      </html>`;


            if (student.email) {
              await sendEmail(student.email, `Student Registration ${status}`, emailText);
          }
          res.json(student);
      } catch (err) {
          res.status(500).send(err.message);
      }
  });
  

// Synchronize students from mentor to class incharge collection (Optional if needed)
app.post('/syncStudent', async (req, res) => {
  try {
    console.log('Received data from class incharge:', req.body);
    const { _id, name, registerNumber, startDate, endDate, collegeName, status, email, numberOfODTaken } = req.body;
    if (!_id || !name || !registerNumber || !startDate || !endDate || !collegeName) {
        return res.status(400).send('Incomplete student data');
    }

  const studentData = {
    name,
    registerNumber,
    startDate,
    endDate,
    collegeName,
    email,
    numberOfODTaken: numberOfODTaken || 0,
    status: status || 'pending'
};
    
    // Find if the student already exists
    const existingStudent = await Student.findById(_id);
    
    if (existingStudent) {
      // Update the existing student
      await Student.findByIdAndUpdate(_id, studentData, { new: true });
    } else {
        // Create a new student
        const newStudent = new Student({
            _id,
            ...studentData
        });

        await newStudent.save()
    }
    
    res.status(200).send('Student synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing student:', error.message);
    res.status(500).send('Error synchronizing student.');
  }
});


  
// Remove student from class incharge collection
app.post('/removeStudent', async (req, res) => {
    const { id } = req.body;
    try {
        const student = await Student.findByIdAndDelete(id);
        if (!student) {
            return res.status(404).send('Student not found');
        }
        res.json({ message: 'Student removed successfully' });
    } catch (err) {
      console.error('Error removing student:', err.message);
      res.status(500).send('Internal Server Error');
    }
});
// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});