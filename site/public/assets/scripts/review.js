function add_like(author = 0, botID) {
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      like: 'Add like to user review',
      author: author,
    }),
    url: `/bots/${botID}`,
    dataType: 'json',
    contentType: 'application/json',
    success: function (res) {
      if (res.check) {
        document.getElementById(
          author + botID + 'like',
        ).innerHTML = `${res.likes} 👍`;
        document.getElementById(author + botID + 'like').style = ``;
      } else {
        document.getElementById(
          author + botID + 'like',
        ).innerHTML = `${res.likes} 👍`;
        document.getElementById(
          author + botID + 'like',
        ).style = `background-color: rgba(255, 255, 255, 0.096); padding: 7px;`;
        document.getElementById(author + botID + 'dislike').style = ``;
        document.getElementById(
          author + botID + 'dislike',
        ).innerHTML = `${res.dislikes} 👎`;
      }
    },
  });
}
function remove_like(author = 0, botID) {
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      dislike: 'remove like to user review',
      author: author,
    }),
    url: `/bots/${botID}`,
    dataType: 'json',
    contentType: 'application/json',
    success: function (res) {
      if (res.check) {
        document.getElementById(
          author + botID + 'dislike',
        ).textContent = `${res.dislikes} 👎`;
        document.getElementById(author + botID + 'dislike').style = ``;
      } else {
        document.getElementById(
          author + botID + 'dislike',
        ).innerHTML = `${res.dislikes} 👎`;
        document.getElementById(
          author + botID + 'dislike',
        ).style = `background-color: rgba(255, 255, 255, 0.096); padding: 7px;`;
        document.getElementById(author + botID + 'like').style = ``;
        document.getElementById(
          author + botID + 'like',
        ).innerHTML = `${res.likes} 👍`;
      }
    },
  });
}
function delete_review(author = 0, botID) {
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      delete_review: 'delete review',
      author: author,
    }),
    url: `/bots/${botID}`,
    dataType: 'json',
    contentType: 'application/json',
    success: function (res) {
      document.getElementById(author + botID).style = 'display: none;';
      document.getElementById('reviews').innerHTML = `${res.reviews} Reviews`;
      document.getElementById('average').innerHTML = res.average.toFixed(1);
    },
  });
}
function delete_reply(author = 0, botID, reply) {
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      delete_reply: 'delete reply',
      author: author,
      reply: reply,
    }),
    url: `/bots/${botID}`,
    dataType: 'json',
    contentType: 'application/json',
  });
  document.getElementById(`${author}${botID}reply`).style = 'display: none;';
}
function flag(author = 0, botID) {
  let text_content = document.getElementById(`${author}${botID}content`);
  let button = document.getElementById(`${author}${botID}flag_button`);
  let flag_button = document.getElementById(`${author}${botID}flag`);
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      flag_review: 'flag bad review',
      author: author,
    }),
    url: `/bots/${botID}`,
    dataType: 'json',
    contentType: 'application/json',
    success: function (res) {
      if (res.flagged) {
        text_content.style = 'color: grey; margin: 15px;';
        text_content.innerHTML = 'This review has been flagged by bot owner.';
        if (button) {
          button.style = 'margin: 15px; display: block;';
        }
        flag_button.innerHTML = 'UnFlag';
      } else {
        text_content.style = 'margin: 15px;';
        text_content.innerHTML = res.content;
        if (button) {
          button.style = 'margin: 15px; display: none;';
        }
        flag_button.innerHTML = 'Flag';
      }
    },
  });
}
function reply(author = 0, botID) {
  let box = document.getElementById(`${author}${botID}add_replybox`);
  let rep = document.getElementById(`${author}${botID}add_reply`);
  if (box.style.display == 'block') {
    box.style = 'display: none; margin-left: 50px;';
    rep.innerHTML = 'Reply';
  } else {
    box.style = 'display: block; margin-left: 50px;';
    rep.innerHTML = 'UnReply';
  }
}
function edit_review(author = 0, botID) {
  let box = document.getElementById(`${author}${botID}edit_box`);
  let rep = document.getElementById(`${author}${botID}edit`);
  if (box.style.display == 'block') {
    box.style = 'display: none; margin-left: 50px;';
    rep.innerHTML = 'Edit';
  } else {
    box.style = 'display: block; margin-left: 50px;';
    rep.innerHTML = 'UnEdit';
  }
}
function reveal(author = 0, botID, content) {
  let text_content = document.getElementById(`${author}${botID}content`);
  let button = document.getElementById(`${author}${botID}flag_button`);
  text_content.style = 'margin: 15px;';
  text_content.innerHTML = content;
  button.style = 'display: none;';
}
