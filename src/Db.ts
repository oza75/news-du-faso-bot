var mongoose = require('mongoose');
mongoose.connect(`mongodb://localhost/${process.env.DB_NAME}`, {useUnifiedTopology: true, useNewUrlParser: true});
