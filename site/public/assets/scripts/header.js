var mybutton = document.getElementById('myBtn');
// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (document.body.scrollTop > 25 || document.documentElement.scrollTop > 25) {
    mybutton.style.display = 'block';
    mybutton.style.animation = 'fadeIn 0.4s';
  } else {
    mybutton.style.display = 'none';
    mybutton.style.animation = 'fadeIn 0.4s';
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

function getCookie(cname) {
  var name = cname + '=';
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

function theme() {
  if (getCookie('theme') == 'light') {
    document.cookie = 'theme=dark; expires=Tue, 19 Jan 2038 03:14:07; path=/';
    window.location.href = window.location.href;
  } else if (getCookie('theme') == 'dark') {
    document.cookie = 'theme=light; expires=Tue, 19 Jan 2038 03:14:07; path=/';
    window.location.href = window.location.href;
  } else {
    document.cookie = 'theme=dark; expires=Tue, 19 Jan 2038 03:14:07; path=/';
    window.location.href = window.location.href;
  }
}

document.getElementById('NewsBtn').onclick = function () {
  document.getElementById('News_Screen').style.display = 'block';
};
function close_news() {
  document.getElementById('News_Screen').style.display = 'none';
}

(function (i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  (i[r] =
    i[r] ||
    function () {
      (i[r].q = i[r].q || []).push(arguments);
    }),
    (i[r].l = 1 * new Date());
  (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m);
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

ga('create', 'G-BXNS77FFHX', 'auto');
ga('send', 'pageview');
