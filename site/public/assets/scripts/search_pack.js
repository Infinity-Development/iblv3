let searchBar = document.getElementById('search_value');
searchBar.addEventListener('keydown', function (event) {
  if (event.code == 'Enter') {
    window.location = `/search?q=${searchBar.value}&packs=true`;
  }
});
$('body').on('keyup', function (event) {
  if (event.key === 'Enter') {
    window.location = `/search?q=${searchBar.value}&packs=true`;
  }
});

$('#search_value').bind('keyup', function () {
  const searchBox = $('#search_value');

  const searchTerm = searchBox.val();

  if (searchTerm) {
    $.ajax({
      url: `/search/bar?q=${searchTerm}&packs=true`,
      type: 'get',
      responseType: 'json',
      success: function (res) {
        if (res.packs) {
          var bots = [];
          var max = res.packs.length > 6 ? 6 : res.packs.length;
          for (let i = 0; i < max; i++) {
            bots.push(`
      <a style="text-decoration: none" href="/packs/${
        res.packs[i].url || 'none'
      }">
      <div class="result">
      <b style="float: right; margin: 5px;">${res.packs[i].votes} Votes</b>
            <div class="container" style="justify-content: left; animation: none;">
            <h6 style="margin: 10px;">${
              res.packs[i].name.length > 18
                ? `${res.packs[i].name.slice(0, 18)}...`
                : res.packs[i].name
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
