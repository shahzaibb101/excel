const express = require('express');
const path = require('path');
const twilio = require('twilio');
const connectDB = require('./db');
const PhoneNumber = require('./models/phoneNumbers');
const ActivePolls = require('./models/activePolls');
const ExcelFile = require('./models/excelFiles');
const MainText = require('./models/mainText');
const Images = require('./models/images');
const Admin = require('./models/admin');
const multer = require('multer');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

// Connect to MongoDB
connectDB();

// Twilio setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;; // Replace with your Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Replace with your Twilio Auth Token
const twilioClient = twilio(accountSid, authToken);

const serviceId = process.env.TWILIO_SERVICE_ID;

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append the file extension
  }
});

const upload = multer({ storage });


// Other middleware and routes
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Set up EJS as the templating engine
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Update Images Route
app.post('/update-images', upload.fields([{ name: 'img1' }, { name: 'img2' }, { name: 'img3' }]), async (req, res) => {
  const img1 = req.files.img1 ? req.files.img1[0].path : undefined;
  const img2 = req.files.img2 ? req.files.img2[0].path : undefined;
  const img3 = req.files.img3 ? req.files.img3[0].path : undefined;

  try {
    // Find the first document in the Images collection and update it
    const updateData = {};
    if (img1) updateData.img1 = img1;
    if (img2) updateData.img2 = img2;
    if (img3) updateData.img3 = img3;

    await Images.findOneAndUpdate({}, updateData);

    res.redirect('/admin');
  } catch (error) {
    console.error('Error updating images:', error.message);
    res.status(500).send('Server error');
  }
});

// Route to render index.ejs
app.get('/', (req, res) => {
  const data = {
    description: 'This is your one stop place to view your favourite excel files and participate in different polls and see poll results.'
  };

  res.render('index', data);
});

// Route to render home.ejs
app.get('/home', async (req, res) => {
  try {
    const excelfiles = await ExcelFile.find();
    const polls = await ActivePolls.find({ completed: false }); // Fetch only active polls
    const maintext = await MainText.findOne();
    const images = await Images.findOne(); 
    res.render('home', { excelfiles: excelfiles, polls: polls, maintext: maintext, images, images });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send('Server error');
  }
});


// Route to handle poll vote submissions
app.post('/vote', async (req, res) => {
  const { pollId, selectedOption } = req.body;

  try {
    // Update the poll by incrementing the vote count for the selected option
    const poll = await ActivePolls.findById(pollId);

    if (poll) {
      poll[selectedOption] = (poll[selectedOption] || 0) + 1; // Increment the selected option's vote count
      await poll.save();
      res.redirect('/home'); // Redirect back to home after voting
    } else {
      res.status(404).send('Poll not found');
    }
  } catch (error) {
    console.error('Error updating poll:', error.message);
    res.status(500).send('Server error');
  }
});

app.get('/admin-login', async (req, res) => {
  res.render('admin_login');
})

app.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;

  try {
      // Check if admin exists
      const admin = await Admin.findOne({ username, password });

      if (admin) {
          // Store admin details in session
          req.session.adminId = admin._id;
          req.session.isAdminLoggedIn = true;

          // Redirect to admin page
          res.redirect('/admin');
      } else {
          res.redirect('/admin-login')
      }
  } catch (err) {
      console.error('Error during admin login:', err.message);
      res.status(500).send('Internal server error');
  }
});


app.get('/admin', async (req, res) => {
  if (! req.session.isAdminLoggedIn) {
    res.redirect('/admin-login');
  }
  try {
    // Fetch all polls where `completed` is false (active polls)
    const activePolls = await ActivePolls.find({ completed: false });
    const completedPolls = await ActivePolls.find({ completed: true });

    // Fetch Excel files for the second tab
    const excelfiles = await ExcelFile.find();

    const maintext = await MainText.findOne();
    const images = await Images.findOne(); 

    // Render the admin template and pass the active and completed polls to the view
    res.render('admin', { polls: activePolls, completedPolls: completedPolls, excelfiles: excelfiles, maintext: maintext, images: images });
  } catch (error) {
    console.error('Error fetching polls:', error.message);
    res.status(500).send('Server error');
  }
});


// Route to mark a poll as completed
app.post('/end-poll/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Set the poll's completed field to true
    await ActivePolls.findByIdAndUpdate(id, { completed: true });
    res.sendStatus(200);
  } catch (error) {
    console.error('Error ending poll:', error.message);
    res.status(500).send('Server error');
  }
});


// Route to handle poll creation
app.post('/create-poll', async (req, res) => {
  const { title, option1, option2, option3 } = req.body;
  try {
    const newPoll = new ActivePolls({ title, option1, option2, option3 });
    await newPoll.save();
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error creating poll');
  }
});

// Route to handle poll updating
app.post('/update-poll/:id', async (req, res) => {
  const { id } = req.params;
  const { title, option1, option2, option3 } = req.body;
  try {
    await ActivePolls.findByIdAndUpdate(id, { title, option1, option2, option3 });
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error updating poll');
  }
});

// Route to handle poll deletion
app.delete('/delete-poll/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await ActivePolls.findByIdAndDelete(id);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send('Error deleting poll');
  }
});

app.post('/create-excel-file', async (req, res) => {
  const { title, link } = req.body;
  console.log('Received data:', { title, link }); // Debug log
  try {
    const newExcelFile = new ExcelFile({ title, link });
    await newExcelFile.save();
    res.redirect('/admin');
  } catch (error) {
    console.error('Error creating Excel file entry:', error);
    res.status(500).send('Error creating Excel file entry');
  }
});


// Route to handle updating an Excel file entry
app.post('/update-excel-file/:id', async (req, res) => {
  const { id } = req.params;
  const { title, link } = req.body;
  try {
    await ExcelFile.findByIdAndUpdate(id, { title, link });
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error updating Excel file entry');
  }
});

// Route to handle deleting an Excel file entry
app.delete('/delete-excel-file/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await ExcelFile.findByIdAndDelete(id);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send('Error deleting Excel file entry');
  }
});

app.post('/update-maintext', async (req,res) => {
  const { heading, subheading } = req.body;

  try {
    // Find the MainText document and update it
    await MainText.findOneAndUpdate({}, { heading, subheading });

    // Redirect back to the home page or show a success message
    res.redirect('/admin'); // or adjust the redirect as needed
  } catch (error) {
    console.error('Error updating MainText:', error.message);
    res.status(500).send('Server error');
  }
});

// Route to display all phone numbers
app.get('/all-phone-numbers', async (req, res) => {
  try {
    const allPhoneNumbers = await PhoneNumber.find();
    console.log(allPhoneNumbers);
    res.json(allPhoneNumbers);
  } catch (error) {
    console.error('Error retrieving phone numbers:', error.message);
    res.status(500).send('Server error');
  }
});

// Route to handle form submission and send code
app.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    console.log(phone);

    // Check if the phone number exists in the database
    const phoneNumber = await PhoneNumber.findOne({ phone });
    if (phoneNumber) {
      // Phone number exists, send verification code
      await twilioClient.verify.v2.services(serviceId)
        .verifications
        .create({ to: phone, channel: 'sms' });
      res.send('exists');
    } else {
      // Phone number does not exist
      res.send('not exists');
    }
  } catch (error) {
    console.error('Error sending verification code:', error.message);
    res.status(500).send('Server error');
  }
});

// Route to handle verification code
app.post('/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    // Check if phone and code are provided
    if (!phone || !code) {
      return res.status(400).send('Phone number and code are required.');
    }

    console.log('Phone:', phone);
    console.log('Code:', code);

    // Verify the code
    const verificationCheck = await twilioClient.verify.v2.services(serviceId)
      .verificationChecks
      .create({ to: phone, code: code });

    if (verificationCheck.status === 'approved') {
      return res.json({ success: true }); // Send success response
    } else {
      return res.json({ success: false, message: 'Verification failed.' });
    }
  } catch (error) {
    console.error('Error verifying code:', error.message);
    res.status(500).send('Server error');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});