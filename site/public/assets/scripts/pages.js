if (Math.abs(window.location.href.split('=')[1]) === 1)
  document.getElementById('prev').style.display = 'none';
function next() {
  window.location.href = `${window.location.href
    .split('?')
    .shift()}?page=${eval(
    Math.abs(window.location.href.split('=')[1] || 0) + 1,
  )}`;
}
function prev() {
  if (
    Math.ceil(eval(Math.abs(window.location.href.split('=')[1] || 0) - 1)) <= 0
  )
    window.location.href = window.location.href.split('?').shift();
  else
    window.location.href = `${window.location.href
      .split('?')
      .shift()}?page=${eval(
      Math.abs(window.location.href.split('=')[1] || 0) - 1,
    )}`;
}
