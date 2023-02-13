const nameInput = document.getElementById('name');
const displayButton = document.getElementById('displayButton');
const serchingText = document.getElementById('serchingText')
const popupText = document.getElementById('popupText');
const wikiList = document.getElementById('wikiList');

displayButton.addEventListener('click',(e) => {
  e.preventDefault();

  generateList(nameInput.value)
    .then (() =>{ //addEventListenerにasync-await関数を設定するのは非推奨なのでthenメソッドを使った
      popup();
      nameInput.value="";
      nameInput.focus();
    }
  )
})

//ポップアップアニメーション
function popup() {
  const str = document.getElementById('birthDay').innerHTML;
  const birthYear = parseInt(str.substring(0, str.indexOf('年')));

  if(!birthYear) {
    popupText.innerHTML = "Unknown!!"
  } else if(birthYear<=1964) {
    popupText.innerHTML = "Great man!!"
  } else if (birthYear<=1994) {
    popupText.innerHTML = "Old man!!"
  } else {
    popupText.innerHTML = "Young man!!"
  }
  popupText.classList.add('animated');
  setTimeout(() => {
    popupText.classList.remove('animated');
  }, 2500);
}

//Wikipediaからデータをfetchしてくる関数
async function fetchWikipediaData (title) {
  url = `https://ja.wikipedia.org/api/rest_v1/page/summary/${title}`
  try {
    const res = await Promise.race([
      fetch(url),
      //タイムアウト処理(10秒)
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 10000))
    ]);
    if (!res.ok) {
      throw new Error('404 Not Found');
    }
    return await res.json();
  } catch (error) {
    return {title:error.message,thumbnail:null,extract:'なし'};
  }
}

//引数に対応したデータリストを出力する関数
async function generateList(pageTitle) {
  wikiList.innerHTML = "";

  serchingText.classList.add("active");
  const data = await fetchWikipediaData(pageTitle)
  const {title,thumbnail,extract} = data
  const birthDay = await getBirthDay(title);
  serchingText.classList.remove("active");


  wikiList.innerHTML = `
    <dt>名前</dt>
    <dd>${title}</dd>
    <dt>プロフィール画像</dt>
    <dd>
      <img src="${thumbnail?thumbnail.source:'https://placehold.jp/30/888888/ffffff/300x150.png?text=no+image'}" alt="">
    </dd>
    <dt>生年月日</dt>
    <dd id="birthDay">${birthDay}</dd>
    <dt>概要</dt>
    <dd>${extract}</dd>
  `
}

//引数のページに書いてある生年月日を取得する関数
async function getBirthDay (title) {
  try {
    const url = `http://ja.wikipedia.org/w/api.php?format=json&action=query&origin=*&prop=revisions&rvprop=content&titles=${title}`
    const res = await fetch(url);
    const data = await res.json();
    const key = Object.keys(data.query.pages)[0];
    const text = data.query.pages[key].revisions[0]['*'];
    const birthDayLine = text.match(/(生年月日と年齢.*)|(death_date.*)|(死亡年月日と没年齢.*)|(生年 =.*)/);
    if(birthDayLine[0].includes("生年 =")) {
      const year = text.match(/生年 =.*/)[0].match(/\d{1,4}/);
      const month = text.match(/生月 =.*/)[0].match(/\d{1,2}/);
      const date = text.match(/生日 =.*/)[0].match(/\d{1,2}/);
      if ([year, month, date].includes(null)) return '不明';
      return `${year}年${month}月${date}日`;
    } else if(birthDayLine[0]) {
      const birthDayArr = birthDayLine[0].match(/\d{1,4}/g);
      const [year, month, date] = birthDayArr;
      if ([year, month, date].includes(null)) return '不明';
      return `${year}年${month}月${date}日`;
    } else {
      return "不明"
    }
  } catch (error) {
    return "不明"
  }
}