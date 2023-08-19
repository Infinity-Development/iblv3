//invite generator
document.getElementById('PopoutBtn').onclick = function () {
  document.getElementById('Popout_window').style.display = 'block';
  document.getElementById('botBtn').style.display = 'none';
};

document.getElementsByClassName('close')[0].onclick = function () {
  document.getElementById('Popout_window').style.display = 'none';
  document.getElementById('botBtn').style.display = 'block';
};

//preview desc
document.getElementById('PreviewBtn').onclick = function () {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('botBtn').style.display = 'none';
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      markdown: 'convert markdown to html',
      content: document.getElementById('long').value,
    }),
    url: `/convert`,
    dataType: 'json',
    contentType: 'application/json',
    success: function (res) {
      setTimeout(() => {
        document.getElementById('preview_text').innerHTML = res.content;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('Preview_window').style.display = 'block';
        document.getElementById('botBtn').style.display = 'none';
      }, 1000);
    },
  });
};

document.getElementsByClassName('close')[1].onclick = function () {
  document.getElementById('Preview_window').style.display = 'none';
  document.getElementById('botBtn').style.display = 'block';
};

function close_preview() {
  document.getElementById('Preview_window').style.display = 'none';
  document.getElementById('botBtn').style.display = 'block';
}

function close_news() {
  document.getElementById('News_Screen').style.display = 'none';
}

window.onclick = function (event) {
  if (event.target == document.getElementById('Preview_window')) {
    document.getElementById('Preview_window').style.display = 'none';
    document.getElementById('botBtn').style.display = 'block';
  } else if (event.target == document.getElementById('Popout_window')) {
    document.getElementById('Popout_window').style.display = 'none';
    document.getElementById('botBtn').style.display = 'block';
  } else if (event.target == document.getElementById('Widgets_window')) {
    document.getElementById('Widgets_window').style.display = 'none';
  }
};

// Discord Webhooks
function webhook() {
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      webhook_test: 'test webhook',
      webhook: document.getElementById('webhook').value,
    }),
    url: `/convert`,
    dataType: 'json',
    contentType: 'application/json',
    success: function (res) {
      alert(res.message);
    },
  });
}

function webhook() {
  fetch('/convert', {
    method: 'POST',
    body: JSON.stringify({
      webhook_test: 'test webhook',
      webhook: document.getElementById('webhook').value,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    success: function (res) {
      alert(res.message);
    },
  });
}

// Custom Webhooks
/**function custom_webhook() {
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      custom_webhook: document.getElementById('custom_webhook').value,
      auth: document.getElementById('custom_webhook_auth').value,
    }),
    url: `/convert`,
    dataType: 'json',
    contentType: 'application/json',
    success: function (res) {
      alert(res.message);
    },
  });
}**/

function custom_webhook() {
  fetch('/convert', {
    method: 'POST',
    body: JSON.stringify({
      custom_webhook: document.getElementById('custom_webhook').value,
      auth: document.getElementById('custom_webhook_auth').value,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    success: function (res) {
      alert(res.message);
    },
  });
}

/** END OF SCRIPT */
