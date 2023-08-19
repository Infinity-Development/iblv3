let searchBar = document.getElementById('search_value');
searchBar.addEventListener('keydown', function (event) {
  if (event.code == 'Enter') {
    window.location = `/search?q=${searchBar.value}`;
  }
});

$('body').on('keyup', function (event) {
  if (event.key === 'Enter') {
    window.location = `/search?q=${searchBar.value}`;
  }
});
$('#search_value').bind('keyup', function () {
  const searchBox = $('#search_value');

  const searchTerm = searchBox.val();

  if (searchTerm) {
    $.ajax({
      url: `/search/bar?q=${searchTerm}`,
      type: 'get',
      responseType: 'json',
      success: function (res) {
        if (res.bots) {
          var bots = [];
          var max = res.bots.length > 6 ? 6 : res.bots.length;
          for (let i = 0; i < max; i++) {
            bots.push(`
      <a style="text-decoration: none" href="/bots/${res.bots[i].ID || 'none'}">
      <div class="result">
      <b style="float: right; margin: 5px;">${res.bots[i].votes} Votes</b>
            <div class="container" style="justify-content: left; animation: none;">
              <img style="width: 45px; border-radius: 10px;" src="${
                res.bots[i].avatar
              }"> 
            <h6 style="margin: 10px;">${
              res.bots[i].name.length > 13
                ? `${res.bots[i].name.slice(0, 13)}...`
                : res.bots[i].name
            }</h6>
          </div>
        </div>
       </a>`);
          }
          $('#output').html(bots.join(''));
        }
      },
    });
  } else $('#output').html('');
});
