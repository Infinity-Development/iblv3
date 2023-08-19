const mongoose = require('mongoose');

const claimSchema = mongoose.Schema({
  botID: {
    type: String,
  },
  claimedBy: {
    type: String,
  },
  claimed: {
    type: Boolean,
  },
});

module.exports = mongoose.model('Claims', claimSchema);
