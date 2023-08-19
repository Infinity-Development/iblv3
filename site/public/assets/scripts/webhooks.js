function webhook() {
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      webhook_test: 'test webhook',
      webhook: document.getElementById('webhook').value,
    }),
    url: `/api/v4/webhooks`,
    dataType: 'json',
    contentType: 'application/json',
    success: function (res) {
      alert(res.message);
    },
  });
}
function custom_webhook() {
  $.ajax({
    type: 'POST',
    data: JSON.stringify({
      custom_webhook: document.getElementById('custom_webhook').value,
      auth: document.getElementById('custom_webhook_auth').value,
    }),
    url: `/api/v4/webhooks`,
    dataType: 'json',
    contentType: 'application/json',
    success: function (res) {
      alert(res.message);
    },
  });
}
