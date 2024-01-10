const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB (replace 'your_database_url' with your MongoDB connection string)
mongoose.connect('mongodb://root:Muhd0508@157.245.148.149:27017/?authMechanism=DEFAULT&authSource=admin', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;


// Event listeners for successful connection and errors
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define a MongoDB schema for your data
const studentSchema = new mongoose.Schema({
  studentId: String,
  name: String,
});

const Student = mongoose.model('Student', studentSchema);

// Creating a Schema for uploaded files
// const fileSchema = new mongoose.Schema({
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   name: {
//     type: String,
//     required: [true, "Uploaded file must have a name"],
//   },
// });
const fileSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    required: [true, "Uploaded file must have a name"],
  },
  imagePath: {
    type: String,
    required: [true, "Image must have a path"],
  },
});

// Creating a Model from that Schema
const File = mongoose.model("File", fileSchema);


// Middleware to parse JSON requests
app.use(bodyParser.json());


  
// Route to add data
app.post('/api/addData', async (req, res) => {
  const { studentId, name } = req.body;

  try {
    // Check if a student with the same studentId already exists
    const existingStudent = await Student.findOne({ studentId });

    if (existingStudent) {
      return res.status(400).json({ message: 'A student with this ID already exists' });
    }

    // Create a new student document
    const newStudent = new Student({ studentId, name });

    // Save the document to the database
    await newStudent.save();

    // Return the _id of the newly created document
    res.status(201).json({ message: 'Data added successfully', recordId: newStudent._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/getAllData', async (req, res) => {
  try {
    const docs = await Student.find({});
    res.json(docs);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.put('/updateData', async (req, res) => {
  const { _id, name, studentId } = req.body;

  try {
    // Find the document by _id and update the name and studentId
    const updatedStudent = await Student.findByIdAndUpdate(
      _id,
      { name, studentId },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  
});

// Route to delete data
app.delete('/deleteData', async (req, res) => {
  const { _id, name, studentId } = req.body;

  try {
    // Find the document by _id and delete it
    const deletedStudent = await Student.deleteOne(_id,
      { name, studentId });

    if (!deletedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(deletedStudent);
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const uploadStorage = multer({ storage: storage })


app.post('/api/addImage', uploadStorage.single("file"), async (req, res) => {
  const { name } = req.body;

  try {
    // Check if a file was provided
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imagePath = req.file.path;

    // Create a new image document
    const newImage = new File({
      name,
      imagePath: req.file.path,
      createdAt: Date.now(),
    });

    // Save the document to the database
    await newImage.save();

    // Return the _id of the newly created document
    res.status(201).json({ message: 'Image added successfully', recordId: newImage._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Route to get all images
app.get('/api/getImages', async (req, res) => {
  try {
    const docs = await File.find({});

    res.json(docs);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to delete image
app.delete('/api/deleteImage/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const imageToDelete = await File.findByIdAndDelete(id);

    if (!imageToDelete) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete the image file from storage
    const filePath = path.join(__dirname, 'uploads', imageToDelete.imagePath);
    fs.unlinkSync(filePath); // Using fs module for file deletion

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



